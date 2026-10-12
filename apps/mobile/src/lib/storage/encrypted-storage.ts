import { gcm } from '@noble/ciphers/aes.js';
import { bytesToUtf8, utf8ToBytes } from '@noble/ciphers/utils.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage key constants & prefixes.
 *
 * Privacy Architecture Note:
 * Sensitive reproductive health metrics (cycle dates, symptom logs, meals, kick logs)
 * are protected at rest using authenticated encryption (AES-256-GCM) with Additional
 * Authenticated Data (AAD) record-binding. Encryption keys are persisted in platform
 * secure storage (expo-secure-store, backed by Android Keystore or iOS Keychain where
 * supported by the device).
 */
export const ENCRYPTION_KEY_ALIAS_V2 = 'health_data_auth_key_v2';
export const LEGACY_KEY_ALIAS_V1 = 'health_data_encryption_key_v1';
export const HEALTH_DATA_PREFIX = '@encrypted_health_data/';
export const MIGRATION_FLAG_KEY = '@health_storage_migrated_v2';
export const LEGACY_BACKUP_SUFFIX = '.legacy_backup';

export const AES_GCM_ALGORITHM = 'AES-256-GCM';
export const KEY_BYTE_LENGTH = 32; // 256 bits
export const NONCE_BYTE_LENGTH = 12; // 96 bits
export const TAG_BYTE_LENGTH = 16; // 128 bits
export const AAD_NAMESPACE = 'happy-women:v2:';

/**
 * Version 2 Authenticated Encryption Envelope Schema.
 */
export interface AuthenticatedHealthPayload {
  version: 2;
  algorithm: typeof AES_GCM_ALGORITHM;
  iv: string; // Base64 encoded 12-byte CSPRNG nonce
  ciphertext: string; // Base64 encoded AES-256-GCM ciphertext
  tag: string; // Base64 encoded 16-byte GMAC authentication tag
  createdAt: number; // Unix timestamp in milliseconds
}

export interface MigrationSummary {
  total: number;
  migrated: number;
  alreadyV2: number;
  failed: number;
}

// In-memory key caches for performant operations
let cachedV2Key: Uint8Array | null = null;
let cachedLegacyKey: string | null = null;
let keyGenerationPromise: Promise<Uint8Array> | null = null;

/**
 * Resets in-memory key caches (useful for testing and secure key rotation).
 */
export function clearKeyCache(): void {
  cachedV2Key = null;
  cachedLegacyKey = null;
  keyGenerationPromise = null;
}

// Base64 lookup tables
const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

/**
 * Byte-accurate Base64 encoder without platform string length limits.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (!bytes || bytes.length === 0) return '';
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < len ? BASE64_CHARS[b2 & 63] : '=';
  }
  return result;
}

/**
 * Byte-accurate Base64 decoder.
 */
export function base64ToBytes(base64: string): Uint8Array {
  if (!base64 || typeof base64 !== 'string') return new Uint8Array(0);
  const len = base64.length;
  if (len === 0) return new Uint8Array(0);

  let padding = 0;
  if (base64.endsWith('==')) padding = 2;
  else if (base64.endsWith('=')) padding = 1;

  const byteLen = (len * 3) / 4 - padding;
  if (byteLen <= 0) return new Uint8Array(0);

  const bytes = new Uint8Array(byteLen);
  let byteIndex = 0;
  for (let i = 0; i < len; i += 4) {
    const c0 = BASE64_LOOKUP[base64.charCodeAt(i)];
    const c1 = BASE64_LOOKUP[base64.charCodeAt(i + 1)];
    const c2 = BASE64_LOOKUP[base64.charCodeAt(i + 2)];
    const c3 = BASE64_LOOKUP[base64.charCodeAt(i + 3)];

    if (byteIndex < byteLen) bytes[byteIndex++] = (c0 << 2) | (c1 >> 4);
    if (byteIndex < byteLen) bytes[byteIndex++] = ((c1 & 15) << 4) | (c2 >> 2);
    if (byteIndex < byteLen) bytes[byteIndex++] = ((c2 & 3) << 6) | c3;
  }
  return bytes;
}

/**
 * Generates cryptographically secure random bytes using platform CSPRNG.
 * Strictly never falls back to Math.random().
 */
export async function getSecureRandomBytes(
  byteCount: number
): Promise<Uint8Array> {
  if (typeof Crypto.getRandomBytesAsync === 'function') {
    const bytes = await Crypto.getRandomBytesAsync(byteCount);
    if (bytes && bytes.length === byteCount) {
      return bytes;
    }
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buffer = new Uint8Array(byteCount);
    globalThis.crypto.getRandomValues(buffer);
    return buffer;
  }

  if (typeof Crypto.getRandomBytes === 'function') {
    const bytes = Crypto.getRandomBytes(byteCount);
    if (bytes && bytes.length === byteCount) {
      return bytes;
    }
  }

  throw new Error(
    'Platform CSPRNG unavailable: cannot generate secure random cryptographic material'
  );
}

/**
 * Retrieve or generate an AES-256 key stored in platform secure storage.
 * Synchronizes concurrent initialization via keyGenerationPromise to prevent race conditions.
 */
export async function getOrCreateAuthenticatedKey(): Promise<Uint8Array> {
  if (cachedV2Key) return cachedV2Key;
  if (keyGenerationPromise) return keyGenerationPromise;

  keyGenerationPromise = (async () => {
    try {
      let base64Key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS_V2);
      if (!base64Key) {
        const rawKey = await getSecureRandomBytes(KEY_BYTE_LENGTH);
        base64Key = bytesToBase64(rawKey);
        await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS_V2, base64Key, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        cachedV2Key = rawKey;
        return rawKey;
      }

      const keyBytes = base64ToBytes(base64Key);
      if (keyBytes.length !== KEY_BYTE_LENGTH) {
        throw new Error('Retrieved v2 encryption key has invalid byte length');
      }
      cachedV2Key = keyBytes;
      return keyBytes;
    } finally {
      keyGenerationPromise = null;
    }
  })();

  return keyGenerationPromise;
}

/**
 * Retrieve the legacy XOR encryption key from SecureStore if it exists.
 */
export async function getLegacyEncryptionKey(): Promise<string | null> {
  if (cachedLegacyKey) return cachedLegacyKey;
  const legacyKey = await SecureStore.getItemAsync(LEGACY_KEY_ALIAS_V1);
  if (legacyKey) {
    cachedLegacyKey = legacyKey;
  }
  return legacyKey;
}

/**
 * Decrypts legacy XOR-obfuscated records for backward-compatible migration.
 */
export function legacyCipherDecrypt(cipherText: string, key: string): string {
  try {
    const decoded = atob(cipherText);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * Binds namespace and record key to Additional Authenticated Data (AAD)
 * to prevent cross-record ciphertext swapping attacks.
 */
export function buildAAD(key: string): Uint8Array {
  return utf8ToBytes(`${AAD_NAMESPACE}${key}`);
}

/**
 * Encrypt arbitrary JSON data with AES-256-GCM, fresh CSPRNG nonce, and AAD.
 */
export async function encryptPayloadV2<T>(
  key: string,
  data: T
): Promise<AuthenticatedHealthPayload> {
  const encKey = await getOrCreateAuthenticatedKey();
  const nonce = await getSecureRandomBytes(NONCE_BYTE_LENGTH);
  const aad = buildAAD(key);

  const jsonString = JSON.stringify(data);
  const plaintextBytes = utf8ToBytes(jsonString);

  const cipher = gcm(encKey, nonce, aad);
  const encryptedWithTag = cipher.encrypt(plaintextBytes);

  const ciphertextBytes = encryptedWithTag.subarray(
    0,
    encryptedWithTag.length - TAG_BYTE_LENGTH
  );
  const tagBytes = encryptedWithTag.subarray(
    encryptedWithTag.length - TAG_BYTE_LENGTH
  );

  return {
    version: 2,
    algorithm: AES_GCM_ALGORITHM,
    iv: bytesToBase64(nonce),
    ciphertext: bytesToBase64(ciphertextBytes),
    tag: bytesToBase64(tagBytes),
    createdAt: Date.now(),
  };
}

/**
 * Decrypts an authenticated health envelope, verifying the GMAC tag before returning plaintext.
 */
export async function decryptPayloadV2<T>(
  key: string,
  envelope: AuthenticatedHealthPayload
): Promise<T> {
  if (envelope.version !== 2 || envelope.algorithm !== AES_GCM_ALGORITHM) {
    throw new Error(
      `Unsupported storage envelope version: ${envelope.version}`
    );
  }

  const encKey = await getOrCreateAuthenticatedKey();
  const nonce = base64ToBytes(envelope.iv);
  const ciphertextBytes = base64ToBytes(envelope.ciphertext);
  const tagBytes = base64ToBytes(envelope.tag);

  if (nonce.length !== NONCE_BYTE_LENGTH) {
    throw new Error('Invalid nonce length in health data envelope');
  }
  if (tagBytes.length !== TAG_BYTE_LENGTH) {
    throw new Error(
      'Invalid authentication tag length in health data envelope'
    );
  }

  const fullPayload = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  fullPayload.set(ciphertextBytes, 0);
  fullPayload.set(tagBytes, ciphertextBytes.length);

  const aad = buildAAD(key);
  const cipher = gcm(encKey, nonce, aad);
  const decryptedBytes = cipher.decrypt(fullPayload);

  const jsonString = bytesToUtf8(decryptedBytes);
  return JSON.parse(jsonString) as T;
}

/**
 * Type guard for AuthenticatedHealthPayload envelopes.
 */
export function isValidV2Envelope(
  obj: unknown
): obj is AuthenticatedHealthPayload {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return (
    p.version === 2 &&
    p.algorithm === AES_GCM_ALGORITHM &&
    typeof p.iv === 'string' &&
    typeof p.ciphertext === 'string' &&
    typeof p.tag === 'string' &&
    typeof p.createdAt === 'number'
  );
}

/**
 * Migrates a legacy record with a multi-step, verification-gated protocol.
 * Guarantees zero data loss even if interrupted or if read-back verification fails.
 */
export async function migrateRecord<T>(
  key: string,
  rawPayload: string
): Promise<T> {
  const storageKey = `${HEALTH_DATA_PREFIX}${key}`;
  const backupKey = `${storageKey}${LEGACY_BACKUP_SUFFIX}`;

  const legacyKey = await getLegacyEncryptionKey();
  if (!legacyKey) {
    throw new Error(
      `Cannot migrate record [${key}]: legacy encryption key is missing from secure storage`
    );
  }

  const decryptedJson = legacyCipherDecrypt(rawPayload, legacyKey);
  if (!decryptedJson) {
    throw new Error(`Cannot migrate record [${key}]: corrupt legacy payload`);
  }

  let parsedData: T;
  try {
    parsedData = JSON.parse(decryptedJson) as T;
  } catch {
    throw new Error(
      `Cannot migrate record [${key}]: legacy data is not valid JSON`
    );
  }

  // Preserve legacy payload in backup before writing new envelope
  await AsyncStorage.setItem(backupKey, rawPayload);

  try {
    const v2Payload = await encryptPayloadV2(key, parsedData);
    await AsyncStorage.setItem(storageKey, JSON.stringify(v2Payload));

    // Read-back verification
    const readBackRaw = await AsyncStorage.getItem(storageKey);
    if (!readBackRaw) {
      throw new Error('Read-back verification failed: empty payload');
    }
    const readBackEnvelope = JSON.parse(readBackRaw);
    const verifiedData = await decryptPayloadV2<T>(key, readBackEnvelope);

    if (JSON.stringify(verifiedData) !== JSON.stringify(parsedData)) {
      throw new Error('Read-back verification failed: data mismatch');
    }

    // Only clean up backup after read-back verification succeeds
    await AsyncStorage.removeItem(backupKey);
    return parsedData;
  } catch (error) {
    // Roll back to raw legacy record on failure
    await AsyncStorage.setItem(storageKey, rawPayload).catch(() => {});
    throw error;
  }
}

/**
 * Main public EncryptedHealthStorage client.
 */
export const EncryptedHealthStorage = {
  /**
   * Securely encrypt and persist health data using AES-256-GCM.
   */
  async setHealthData<T>(key: string, data: T): Promise<void> {
    const storageKey = `${HEALTH_DATA_PREFIX}${key}`;
    const v2Payload = await encryptPayloadV2(key, data);
    await AsyncStorage.setItem(storageKey, JSON.stringify(v2Payload));
    // Clean up any stale backup for this key
    await AsyncStorage.removeItem(`${storageKey}${LEGACY_BACKUP_SUFFIX}`).catch(
      () => {}
    );
  },

  /**
   * Decrypt and retrieve sensitive health data, supporting legacy migration.
   */
  async getHealthData<T>(key: string): Promise<T | null> {
    const storageKey = `${HEALTH_DATA_PREFIX}${key}`;
    const backupKey = `${storageKey}${LEGACY_BACKUP_SUFFIX}`;

    try {
      let rawValue = await AsyncStorage.getItem(storageKey);

      // Check if interrupted migration left a backup
      if (!rawValue) {
        const backupValue = await AsyncStorage.getItem(backupKey);
        if (backupValue) {
          rawValue = backupValue;
          await AsyncStorage.setItem(storageKey, rawValue);
        } else {
          return null;
        }
      }

      let parsedJson: unknown = null;
      try {
        parsedJson = JSON.parse(rawValue);
      } catch {
        parsedJson = null;
      }

      if (isValidV2Envelope(parsedJson)) {
        const decrypted = await decryptPayloadV2<T>(key, parsedJson);
        await AsyncStorage.removeItem(backupKey).catch(() => {});
        return decrypted;
      }

      // Check for backup recovery if current payload is corrupt
      const backupValue = await AsyncStorage.getItem(backupKey);
      if (backupValue && backupValue !== rawValue) {
        try {
          return await migrateRecord<T>(key, backupValue);
        } catch {
          // Fall back to attempting migration of rawValue
        }
      }

      return await migrateRecord<T>(key, rawValue);
    } catch {
      // Return null on failure; preserve stored payload without overwriting
      return null;
    }
  },

  /**
   * Remove a sensitive health data record and any pending backup.
   */
  async removeHealthData(key: string): Promise<void> {
    const storageKey = `${HEALTH_DATA_PREFIX}${key}`;
    await AsyncStorage.removeItem(storageKey);
    await AsyncStorage.removeItem(`${storageKey}${LEGACY_BACKUP_SUFFIX}`);
  },

  /**
   * Inspect envelope version for a given key (1 for legacy, 2 for authenticated).
   */
  async getStorageVersion(key: string): Promise<1 | 2 | null> {
    const storageKey = `${HEALTH_DATA_PREFIX}${key}`;
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (isValidV2Envelope(parsed)) return 2;
    } catch {}
    return 1;
  },

  /**
   * Bulk migration of all existing health data records to AES-256-GCM.
   */
  async migrateAllHealthData(): Promise<MigrationSummary> {
    const allKeys = await AsyncStorage.getAllKeys();
    const healthKeys = allKeys
      .filter(
        (k) =>
          k.startsWith(HEALTH_DATA_PREFIX) && !k.endsWith(LEGACY_BACKUP_SUFFIX)
      )
      .map((k) => k.slice(HEALTH_DATA_PREFIX.length));

    const summary: MigrationSummary = {
      total: healthKeys.length,
      migrated: 0,
      alreadyV2: 0,
      failed: 0,
    };

    for (const key of healthKeys) {
      try {
        const storageKey = `${HEALTH_DATA_PREFIX}${key}`;
        const raw = await AsyncStorage.getItem(storageKey);
        if (!raw) continue;

        let isV2 = false;
        try {
          const parsed = JSON.parse(raw);
          if (isValidV2Envelope(parsed)) {
            isV2 = true;
            summary.alreadyV2++;
          }
        } catch {}

        if (!isV2) {
          await migrateRecord(key, raw);
          summary.migrated++;
        }
      } catch {
        summary.failed++;
      }
    }

    if (summary.failed === 0) {
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      await SecureStore.deleteItemAsync(LEGACY_KEY_ALIAS_V1).catch(() => {});
      cachedLegacyKey = null;
    }

    return summary;
  },

  /**
   * Wipe all local encrypted health data and secure keys (Local Health Data Purge).
   */
  async purgeAllHealthData(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const healthKeys = allKeys.filter(
      (k) => k.startsWith(HEALTH_DATA_PREFIX) || k === MIGRATION_FLAG_KEY
    );
    if (healthKeys.length > 0) {
      await AsyncStorage.multiRemove(healthKeys);
    }

    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_ALIAS_V2).catch(() => {});
    await SecureStore.deleteItemAsync(LEGACY_KEY_ALIAS_V1).catch(() => {});

    cachedV2Key = null;
    cachedLegacyKey = null;
  },

  /**
   * Clear in-memory cached keys.
   */
  clearKeyCache,
};

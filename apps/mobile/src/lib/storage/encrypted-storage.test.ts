import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { useHealthStore } from '@/store/useHealthStore';

import {
  AES_GCM_ALGORITHM,
  base64ToBytes,
  bytesToBase64,
  clearKeyCache,
  decryptPayloadV2,
  EncryptedHealthStorage,
  ENCRYPTION_KEY_ALIAS_V2,
  HEALTH_DATA_PREFIX,
  LEGACY_BACKUP_SUFFIX,
  LEGACY_KEY_ALIAS_V1,
  migrateRecord,
  MIGRATION_FLAG_KEY,
} from './encrypted-storage';

/**
 * Creates authentic legacy XOR fixtures matching pre-migration storage.
 */
function createLegacyFixture(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

const TEST_LEGACY_KEY =
  'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0';

describe('EncryptedHealthStorage - Base64 & V2 AEAD Cryptography', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    clearKeyCache();
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_ALIAS_V2);
    await SecureStore.deleteItemAsync(LEGACY_KEY_ALIAS_V1);
  });

  afterEach(async () => {
    await EncryptedHealthStorage.purgeAllHealthData();
  });

  it('round trips arbitrary byte arrays across multiple lengths', () => {
    for (const len of [0, 1, 2, 3, 12, 16, 32, 64, 127]) {
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = (i * 23 + 5) & 0xff;
      const encoded = bytesToBase64(bytes);
      const decoded = base64ToBytes(encoded);
      expect(decoded.length).toBe(bytes.length);
      expect(Array.from(decoded)).toEqual(Array.from(bytes));
    }
  });

  it('gracefully handles empty and invalid inputs', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
    expect(base64ToBytes('')).toEqual(new Uint8Array(0));
    expect(base64ToBytes(null as unknown as string)).toEqual(new Uint8Array(0));
  });

  it('encrypts and decrypts structured health data round-trip', async () => {
    const sensitiveData = {
      mode: 'pregnancy',
      lastPeriodDate: '2026-02-14',
      symptoms: [{ name: 'nausea', severity: 2 }],
    };

    await EncryptedHealthStorage.setHealthData('user_mode', sensitiveData);
    const retrieved =
      await EncryptedHealthStorage.getHealthData<typeof sensitiveData>(
        'user_mode'
      );

    expect(retrieved).toEqual(sensitiveData);
    expect(await EncryptedHealthStorage.getStorageVersion('user_mode')).toBe(2);
  });

  it('stores data in version 2 envelope with no plaintext leakage', async () => {
    const secretNote = 'Secret clinical symptom note 987654';
    await EncryptedHealthStorage.setHealthData('symptoms_state', {
      note: secretNote,
    });

    const rawStored = await AsyncStorage.getItem(
      `${HEALTH_DATA_PREFIX}symptoms_state`
    );
    expect(rawStored).toBeTruthy();

    const envelope = JSON.parse(rawStored!);
    expect(envelope).toMatchObject({
      version: 2,
      algorithm: AES_GCM_ALGORITHM,
    });
    expect(typeof envelope.iv).toBe('string');
    expect(typeof envelope.ciphertext).toBe('string');
    expect(typeof envelope.tag).toBe('string');
    expect(typeof envelope.createdAt).toBe('number');

    // Assert zero plaintext leakage
    expect(rawStored).not.toContain(secretNote);
    expect(rawStored).not.toContain('symptoms_state');
  });

  it('strictly avoids Math.random() for key and nonce generation', async () => {
    const mathRandomSpy = jest.spyOn(Math, 'random');

    await EncryptedHealthStorage.setHealthData('test_random', { foo: 'bar' });

    expect(mathRandomSpy).not.toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });

  it('generates unique random nonces for consecutive writes of identical data', async () => {
    let callCount = 0;
    const cryptoSpy = jest
      .spyOn(Crypto, 'getRandomBytesAsync')
      .mockImplementation(async (len) => {
        callCount++;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = (callCount * 41 + i) & 0xff;
        return bytes;
      });

    const data = { marker: 'test_repeat' };

    await EncryptedHealthStorage.setHealthData('key_a', data);
    await EncryptedHealthStorage.setHealthData('key_b', data);

    const rawA = await AsyncStorage.getItem(`${HEALTH_DATA_PREFIX}key_a`);
    const rawB = await AsyncStorage.getItem(`${HEALTH_DATA_PREFIX}key_b`);

    const envA = JSON.parse(rawA!);
    const envB = JSON.parse(rawB!);

    expect(envA.iv).not.toBe(envB.iv);
    expect(envA.ciphertext).not.toBe(envB.ciphertext);

    cryptoSpy.mockRestore();
  });

  it('rejects tampered ciphertext with tag authentication failure', async () => {
    await EncryptedHealthStorage.setHealthData('tamper_test', {
      value: 123,
    });
    const raw = await AsyncStorage.getItem(`${HEALTH_DATA_PREFIX}tamper_test`);
    const envelope = JSON.parse(raw!);

    // Tamper with ciphertext bytes
    const ctBytes = base64ToBytes(envelope.ciphertext);
    ctBytes[0] ^= 0x55;
    envelope.ciphertext = bytesToBase64(ctBytes);

    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}tamper_test`,
      JSON.stringify(envelope)
    );

    await expect(decryptPayloadV2('tamper_test', envelope)).rejects.toThrow();

    const result = await EncryptedHealthStorage.getHealthData('tamper_test');
    expect(result).toBeNull();
  });

  it('rejects tampered authentication tag', async () => {
    await EncryptedHealthStorage.setHealthData('tag_test', { value: 456 });
    const raw = await AsyncStorage.getItem(`${HEALTH_DATA_PREFIX}tag_test`);
    const envelope = JSON.parse(raw!);

    const tagBytes = base64ToBytes(envelope.tag);
    tagBytes[0] ^= 0xaa;
    envelope.tag = bytesToBase64(tagBytes);

    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}tag_test`,
      JSON.stringify(envelope)
    );

    await expect(decryptPayloadV2('tag_test', envelope)).rejects.toThrow();
    expect(await EncryptedHealthStorage.getHealthData('tag_test')).toBeNull();
  });

  it('rejects ciphertext swapping between records via AAD binding', async () => {
    await EncryptedHealthStorage.setHealthData('symptoms_state', {
      symptom: 'cramps',
    });
    const rawSymptoms = await AsyncStorage.getItem(
      `${HEALTH_DATA_PREFIX}symptoms_state`
    );

    // Attacker copies symptoms ciphertext to meals_state
    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}meals_state`,
      rawSymptoms!
    );

    // Reading meals_state fails because AAD binds key name 'meals_state'
    const swappedResult =
      await EncryptedHealthStorage.getHealthData('meals_state');
    expect(swappedResult).toBeNull();
  });

  it('rejects decryption when an incorrect key is provided', async () => {
    await EncryptedHealthStorage.setHealthData('key_check', { ok: true });
    const raw = await AsyncStorage.getItem(`${HEALTH_DATA_PREFIX}key_check`);
    const envelope = JSON.parse(raw!);

    // Overwrite key in SecureStore with a different 32-byte key
    const wrongKey = new Uint8Array(32).fill(77);
    await SecureStore.setItemAsync(
      ENCRYPTION_KEY_ALIAS_V2,
      bytesToBase64(wrongKey)
    );

    clearKeyCache();

    await expect(decryptPayloadV2('key_check', envelope)).rejects.toThrow();
  });
});

describe('EncryptedHealthStorage - Legacy Migration & Recovery', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    clearKeyCache();
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_ALIAS_V2);
    await SecureStore.deleteItemAsync(LEGACY_KEY_ALIAS_V1);
  });

  afterEach(async () => {
    await EncryptedHealthStorage.purgeAllHealthData();
  });

  it('decrypts legacy XOR records and auto-migrates to V2 authenticated format', async () => {
    await SecureStore.setItemAsync(LEGACY_KEY_ALIAS_V1, TEST_LEGACY_KEY);

    const legacyData = {
      symptoms: ['headache', 'fatigue'],
      loggedAt: '2026-01-10T10:00:00Z',
    };
    const legacyCiphertext = createLegacyFixture(
      JSON.stringify(legacyData),
      TEST_LEGACY_KEY
    );

    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}symptoms_state`,
      legacyCiphertext
    );

    expect(
      await EncryptedHealthStorage.getStorageVersion('symptoms_state')
    ).toBe(1);

    const recovered =
      await EncryptedHealthStorage.getHealthData<typeof legacyData>(
        'symptoms_state'
      );
    expect(recovered).toEqual(legacyData);

    expect(
      await EncryptedHealthStorage.getStorageVersion('symptoms_state')
    ).toBe(2);

    const updatedRaw = await AsyncStorage.getItem(
      `${HEALTH_DATA_PREFIX}symptoms_state`
    );
    const envelope = JSON.parse(updatedRaw!);
    expect(envelope.version).toBe(2);
    expect(envelope.algorithm).toBe(AES_GCM_ALGORITHM);

    const backup = await AsyncStorage.getItem(
      `${HEALTH_DATA_PREFIX}symptoms_state${LEGACY_BACKUP_SUFFIX}`
    );
    expect(backup).toBeNull();
  });

  it('recovers from interrupted migration when .legacy_backup exists', async () => {
    await SecureStore.setItemAsync(LEGACY_KEY_ALIAS_V1, TEST_LEGACY_KEY);

    const intactData = { kickCount: 14 };
    const legacyCiphertext = createLegacyFixture(
      JSON.stringify(intactData),
      TEST_LEGACY_KEY
    );

    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}kick_logs`,
      'CORRUPTED_INCOMPLETE_WRITE'
    );
    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}kick_logs${LEGACY_BACKUP_SUFFIX}`,
      legacyCiphertext
    );

    const result = await EncryptedHealthStorage.getHealthData<{
      kickCount: number;
    }>('kick_logs');

    expect(result).toEqual(intactData);
    expect(await EncryptedHealthStorage.getStorageVersion('kick_logs')).toBe(2);

    expect(
      await AsyncStorage.getItem(
        `${HEALTH_DATA_PREFIX}kick_logs${LEGACY_BACKUP_SUFFIX}`
      )
    ).toBeNull();
  });

  it('preserves legacy record if legacy key is missing in SecureStore', async () => {
    const legacyPayload = 'ENCRYPTED_BLOB_NO_KEY';
    await AsyncStorage.setItem(`${HEALTH_DATA_PREFIX}user_mode`, legacyPayload);

    const result = await EncryptedHealthStorage.getHealthData('user_mode');
    expect(result).toBeNull();

    const preserved = await AsyncStorage.getItem(
      `${HEALTH_DATA_PREFIX}user_mode`
    );
    expect(preserved).toBe(legacyPayload);
  });

  it('bulk migrates all legacy records and retires legacy key upon 100% success', async () => {
    await SecureStore.setItemAsync(LEGACY_KEY_ALIAS_V1, TEST_LEGACY_KEY);

    const rec1 = { mode: 'cycle' };
    const rec2 = [{ meal: 'spinach salad', iron: 15 }];

    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}user_mode`,
      createLegacyFixture(JSON.stringify(rec1), TEST_LEGACY_KEY)
    );
    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}meals_state`,
      createLegacyFixture(JSON.stringify(rec2), TEST_LEGACY_KEY)
    );

    const summary = await EncryptedHealthStorage.migrateAllHealthData();
    expect(summary.total).toBe(2);
    expect(summary.migrated).toBe(2);
    expect(summary.failed).toBe(0);

    expect(await EncryptedHealthStorage.getStorageVersion('user_mode')).toBe(2);
    expect(await EncryptedHealthStorage.getStorageVersion('meals_state')).toBe(
      2
    );

    expect(await AsyncStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');
    expect(await SecureStore.getItemAsync(LEGACY_KEY_ALIAS_V1)).toBeNull();

    const secondSummary = await EncryptedHealthStorage.migrateAllHealthData();
    expect(secondSummary.total).toBe(2);
    expect(secondSummary.alreadyV2).toBe(2);
    expect(secondSummary.migrated).toBe(0);
    expect(secondSummary.failed).toBe(0);
  });

  it('preserves original record if read-back verification fails', async () => {
    await SecureStore.setItemAsync(LEGACY_KEY_ALIAS_V1, TEST_LEGACY_KEY);

    const legacyPayload = createLegacyFixture(
      JSON.stringify({ intact: true }),
      TEST_LEGACY_KEY
    );
    await AsyncStorage.setItem(`${HEALTH_DATA_PREFIX}test_fail`, legacyPayload);

    await expect(
      migrateRecord(
        'test_fail',
        createLegacyFixture('not_valid_json{', TEST_LEGACY_KEY)
      )
    ).rejects.toThrow();

    const after = await AsyncStorage.getItem(`${HEALTH_DATA_PREFIX}test_fail`);
    expect(after).toBe(legacyPayload);
  });
});

describe('EncryptedHealthStorage - Purge & Health Store Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    clearKeyCache();
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_ALIAS_V2);
    await SecureStore.deleteItemAsync(LEGACY_KEY_ALIAS_V1);
  });

  afterEach(async () => {
    await EncryptedHealthStorage.purgeAllHealthData();
  });

  it('completely removes all encrypted health data and secure store keys', async () => {
    await EncryptedHealthStorage.setHealthData('user_mode', 'cycle');
    await EncryptedHealthStorage.setHealthData('symptoms_state', [{ id: 1 }]);
    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}stale${LEGACY_BACKUP_SUFFIX}`,
      'backup'
    );
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');

    await EncryptedHealthStorage.purgeAllHealthData();

    const keys = await AsyncStorage.getAllKeys();
    const remainingHealth = keys.filter((k) =>
      k.startsWith(HEALTH_DATA_PREFIX)
    );
    expect(remainingHealth).toEqual([]);
    expect(await AsyncStorage.getItem(MIGRATION_FLAG_KEY)).toBeNull();

    expect(await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS_V2)).toBeNull();
    expect(await SecureStore.getItemAsync(LEGACY_KEY_ALIAS_V1)).toBeNull();
  });

  it('removeHealthData deletes single key and its backup', async () => {
    await EncryptedHealthStorage.setHealthData('to_delete', { val: 1 });
    await AsyncStorage.setItem(
      `${HEALTH_DATA_PREFIX}to_delete${LEGACY_BACKUP_SUFFIX}`,
      'backup'
    );

    await EncryptedHealthStorage.removeHealthData('to_delete');

    expect(
      await AsyncStorage.getItem(`${HEALTH_DATA_PREFIX}to_delete`)
    ).toBeNull();
    expect(
      await AsyncStorage.getItem(
        `${HEALTH_DATA_PREFIX}to_delete${LEGACY_BACKUP_SUFFIX}`
      )
    ).toBeNull();
  });

  it('seamlessly integrates with useHealthStore to persist and restore health data', async () => {
    useHealthStore.getState().setMode('pregnancy');
    useHealthStore.getState().incrementKick();
    useHealthStore.getState().saveKickSession();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(await EncryptedHealthStorage.getStorageVersion('user_mode')).toBe(2);
    expect(await EncryptedHealthStorage.getStorageVersion('kick_logs')).toBe(2);

    useHealthStore.setState({ mode: 'cycle', kickLogs: [] });
    expect(useHealthStore.getState().mode).toBe('cycle');

    await useHealthStore.getState().loadEncryptedState();

    expect(useHealthStore.getState().mode).toBe('pregnancy');
    expect(useHealthStore.getState().kickLogs.length).toBeGreaterThan(0);
  });
});

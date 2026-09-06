import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * The key that encrypts the on-device preference store (`src/lib/storage.tsx`).
 *
 * Lives here rather than in `storage.tsx` because `expo-secure-store` is only
 * imported under `src/lib/auth/` (see `.claude/rules/auth-security.md`), and
 * because this file must stay a leaf: `storage.tsx` imports it, so it can
 * never import `storage.tsx` back.
 */

// Secure storage key names allow alphanumerics, '.', '-' and '_' only.
const STORAGE_KEY_ENTRY = 'app.storage.key';
/**
 * MMKV encrypts with AES-128 and reads at most 16 bytes of the key string.
 * 12 random bytes base64-encode to exactly 16 ASCII characters with no
 * padding, so the whole string is used and none of it is silently dropped.
 */
const KEY_RANDOM_BYTES = 12;

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Minimal base64 for a byte length divisible by 3 — Hermes has no `btoa`. */
function base64ForTriplets(bytes: Uint8Array): string {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const triplet =
      (bytes[index] << 16) | (bytes[index + 1] << 8) | bytes[index + 2];
    output +=
      BASE64_ALPHABET[(triplet >> 18) & 63] +
      BASE64_ALPHABET[(triplet >> 12) & 63] +
      BASE64_ALPHABET[(triplet >> 6) & 63] +
      BASE64_ALPHABET[triplet & 63];
  }
  return output;
}

/**
 * Returns the device's storage encryption key, generating and persisting one
 * in the OS keystore on first use. The key never leaves the device and is
 * never logged, so the encrypted store cannot be read from a backup or by
 * another app.
 */
export async function getStorageEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(STORAGE_KEY_ENTRY);
  if (existing) return existing;

  const randomBytes = await Crypto.getRandomBytesAsync(KEY_RANDOM_BYTES);
  const key = base64ForTriplets(randomBytes);
  await SecureStore.setItemAsync(STORAGE_KEY_ENTRY, key);
  return key;
}

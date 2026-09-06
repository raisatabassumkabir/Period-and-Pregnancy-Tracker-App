import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';

import { getStorageEncryptionKey } from './auth/storage-key';

/**
 * Encrypted on-device preference store.
 *
 * Backed by `react-native-mmkv` with an AES key that lives in the OS keystore
 * (`./auth/storage-key.ts`), so cached UI state — tracking mode, kick counts,
 * discharge logs — is unreadable outside this app on this device. Auth tokens
 * still live in `expo-secure-store` via `src/lib/auth/utils.tsx`; this store
 * is for everything that is private but not a credential.
 *
 * The API is async even though MMKV itself is synchronous: fetching the key
 * from the keystore is async, and keeping the signature let every caller stay
 * exactly as it was when this was AsyncStorage.
 */

const STORE_ID = 'app.preferences';
/** Set once the AsyncStorage contents of older builds have been moved over. */
const MIGRATION_FLAG = '__migrated_from_async_storage_v1';
/** Owned by `src/lib/auth/utils.tsx`, which migrates it into SecureStore. */
const LEGACY_TOKEN_KEY = 'token';

/**
 * Non-secret preferences only. Auth tokens live in expo-secure-store via
 * `src/lib/auth/utils.tsx`. Add one key per persisted preference.
 */
export const STORAGE_KEYS = {
  SELECTED_PALETTE: '@app/selected_palette',
  /** Kick counts per calendar day. No backend endpoint exists for these yet. */
  KICK_COUNTS: '@app/kick_counts',
  /** Onboarding mode choice; synced to `profile.mode` once the backend runs. */
  TRACKING_MODE: '@app/tracking_mode',
  /** Discharge per calendar day. `DailyLog` has no column for it yet. */
  DISCHARGE_LOGS: '@app/discharge_logs',
} as const;

let storePromise: Promise<MMKV> | null = null;

/**
 * Moves every preference an older build left in AsyncStorage into the
 * encrypted store, then deletes the plaintext copy. Runs once per install.
 */
async function migrateFromAsyncStorage(store: MMKV): Promise<void> {
  if (store.getBoolean(MIGRATION_FLAG)) return;

  const keys = (await AsyncStorage.getAllKeys()).filter(
    (key) => key !== LEGACY_TOKEN_KEY
  );
  if (keys.length > 0) {
    const entries = await AsyncStorage.multiGet(keys);
    for (const [key, value] of entries) {
      if (value !== null && !store.contains(key)) store.set(key, value);
    }
    await AsyncStorage.multiRemove(keys);
  }
  store.set(MIGRATION_FLAG, true);
}

async function createStore(): Promise<MMKV> {
  const encryptionKey = await getStorageEncryptionKey();
  const store = new MMKV({ id: STORE_ID, encryptionKey });
  await migrateFromAsyncStorage(store);
  return store;
}

function openStore(): Promise<MMKV> {
  if (!storePromise) {
    storePromise = createStore().catch((error: unknown) => {
      // Let the next call retry rather than pinning a rejected promise.
      storePromise = null;
      throw error;
    });
  }
  return storePromise;
}

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const store = await openStore();
    const value = store.getString(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    // A missing keystore or a corrupt entry reads as "no preference": every
    // caller has a default, and a preference must never block launch.
    console.warn('Preference store unavailable; using defaults', error);
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  const store = await openStore();
  store.set(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  const store = await openStore();
  store.delete(key);
}

export async function clear(): Promise<void> {
  const store = await openStore();
  store.clearAll();
}

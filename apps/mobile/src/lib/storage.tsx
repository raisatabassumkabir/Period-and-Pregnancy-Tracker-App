import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = AsyncStorage;

/**
 * Non-secret preferences only. Auth tokens live in expo-secure-store via
 * `src/lib/auth/utils.tsx`. Add one key per persisted preference.
 */
export const STORAGE_KEYS = {
  SELECTED_PALETTE: '@app/selected_palette',
} as const;

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await storage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await storage.removeItem(key);
}

export async function clear(): Promise<void> {
  await storage.clear();
}

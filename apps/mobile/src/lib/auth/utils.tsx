import * as SecureStore from 'expo-secure-store';

import { getItem, removeItem } from '@/lib/storage';

// Secure storage key (alphanumeric, '.', '-', '_' only).
const TOKEN_KEY = 'app.auth.token';
// Builds that predate SecureStore kept the token in AsyncStorage under this key.
const LEGACY_ASYNC_STORAGE_KEY = 'token';

export type TokenType = {
  access: string;
  refresh: string;
};

const readSecure = async (): Promise<TokenType | null> => {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenType;
  } catch {
    // Corrupt entry: treat as signed out rather than crash at launch.
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return null;
  }
};

/** One-time move of a token written by older builds into the encrypted store. */
const migrateLegacyToken = async (): Promise<TokenType | null> => {
  const legacy = await getItem<TokenType>(LEGACY_ASYNC_STORAGE_KEY);
  if (!legacy) return null;
  await setToken(legacy);
  await removeItem(LEGACY_ASYNC_STORAGE_KEY);
  return legacy;
};

export const getToken = async (): Promise<TokenType | null> =>
  (await readSecure()) ?? (await migrateLegacyToken());

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await removeItem(LEGACY_ASYNC_STORAGE_KEY);
};

export const setToken = async (value: TokenType): Promise<void> =>
  SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(value));

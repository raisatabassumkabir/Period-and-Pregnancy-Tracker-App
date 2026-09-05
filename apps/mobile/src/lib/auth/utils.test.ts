import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { getToken, removeToken, setToken } from './utils';

const TOKEN = { access: 'access-1', refresh: 'refresh-1' };
const SECURE_KEY = 'app.auth.token';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
  await SecureStore.deleteItemAsync(SECURE_KEY);
  jest.clearAllMocks();
});

describe('auth token storage', () => {
  it('round-trips through SecureStore', async () => {
    await setToken(TOKEN);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      SECURE_KEY,
      JSON.stringify(TOKEN)
    );
    await expect(getToken()).resolves.toEqual(TOKEN);
    expect(await AsyncStorage.getItem('token')).toBeNull();
  });

  it('returns null when nothing is stored', async () => {
    await expect(getToken()).resolves.toBeNull();
  });

  it('migrates a legacy AsyncStorage token and removes the plaintext copy', async () => {
    await AsyncStorage.setItem('token', JSON.stringify(TOKEN));

    await expect(getToken()).resolves.toEqual(TOKEN);

    expect(await AsyncStorage.getItem('token')).toBeNull();
    expect(await SecureStore.getItemAsync(SECURE_KEY)).toBe(
      JSON.stringify(TOKEN)
    );
  });

  it('treats a corrupt secure entry as signed out', async () => {
    await SecureStore.setItemAsync(SECURE_KEY, '{not json');
    await expect(getToken()).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SECURE_KEY);
  });

  it('removeToken clears both stores', async () => {
    await setToken(TOKEN);
    await AsyncStorage.setItem('token', JSON.stringify(TOKEN));
    await removeToken();
    await expect(getToken()).resolves.toBeNull();
    expect(await AsyncStorage.getItem('token')).toBeNull();
  });
});

import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';
import { MMKV } from 'react-native-mmkv';

const QUERY_CACHE_STORAGE_ID = 'app.react_query_cache';
const QUERY_CACHE_KEY = 'REACT_QUERY_OFFLINE_CACHE';

/** Dedicated MMKV instance for fast synchronous React Query cache storage. */
export const queryStorage = new MMKV({ id: QUERY_CACHE_STORAGE_ID });

/**
 * Creates a synchronous, high-speed MMKV persister for TanStack Query.
 * Restores and persists query cache without asynchronous storage overhead.
 */
export function createMMKVQueryPersister(
  storage: MMKV = queryStorage
): Persister {
  return {
    persistClient: (client: PersistedClient) => {
      try {
        storage.set(QUERY_CACHE_KEY, JSON.stringify(client));
      } catch (error) {
        console.warn('[QueryPersister] Failed to persist client to MMKV:', error);
      }
    },
    restoreClient: (): PersistedClient | undefined => {
      try {
        const raw = storage.getString(QUERY_CACHE_KEY);
        if (!raw) return undefined;
        return JSON.parse(raw) as PersistedClient;
      } catch (error) {
        console.warn(
          '[QueryPersister] Failed to restore client from MMKV:',
          error
        );
        return undefined;
      }
    },
    removeClient: () => {
      try {
        storage.delete(QUERY_CACHE_KEY);
      } catch (error) {
        console.warn(
          '[QueryPersister] Failed to remove client from MMKV:',
          error
        );
      }
    },
  };
}

export const queryPersister = createMMKVQueryPersister();

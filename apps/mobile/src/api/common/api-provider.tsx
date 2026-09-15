import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as React from 'react';

import { networkInformation } from './network-information';
import { queryPersister } from './query-persister';

const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;
const FIVE_MINUTES_MS = 1000 * 60 * 5;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: SEVEN_DAYS_MS,
      staleTime: FIVE_MINUTES_MS,
      networkMode: 'offlineFirst',
      retry: 2,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3,
    },
  },
});

export function APIProvider({ children }: { children: React.ReactNode }) {
  useReactQueryDevTools(queryClient);

  React.useEffect(() => {
    // Keep networkInformation listener active
    networkInformation.getOnlineStatus();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: SEVEN_DAYS_MS,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}


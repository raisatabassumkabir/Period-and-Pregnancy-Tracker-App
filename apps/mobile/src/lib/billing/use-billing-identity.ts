import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useMe } from '@/api/auth';
import { useAuth } from '@/lib/auth';
import { hideUpgrade } from '@/lib/upgrade';

import { getBillingClient } from './index';

/**
 * Manages the RevenueCat customer identity lifecycle.
 *
 * Binds the stable Django user UUID (from useMe()) to RevenueCat.
 * Disconnects identity on sign-out to prevent entitlement leakage across accounts.
 * Refreshes subscription state when returning from the background.
 */
export function useBillingIdentity(): void {
  const queryClient = useQueryClient();
  const token = useAuth((s) => s.token);
  const status = useAuth((s) => s.status);
  const { data: user } = useMe({ enabled: !!token });
  const lastIdentifiedId = useRef<string | null>(null);

  useEffect(() => {
    const billing = getBillingClient();

    if (token && user?.id) {
      if (lastIdentifiedId.current !== user.id) {
        if (lastIdentifiedId.current !== null) {
          queryClient.removeQueries({ queryKey: ['payments'] });
          queryClient.removeQueries({ queryKey: ['me'] });
          hideUpgrade();
        }
        lastIdentifiedId.current = user.id;
        billing
          .identifyUser(user.id)
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: ['payments', 'subscription-status'],
            });
          })
          .catch(() => {});
      }
    } else if (!token || status === 'signOut') {
      if (lastIdentifiedId.current !== null) {
        lastIdentifiedId.current = null;
        queryClient.removeQueries({ queryKey: ['payments'] });
        queryClient.removeQueries({ queryKey: ['me'] });
        hideUpgrade();
        billing.resetUser().catch(() => {});
      }
    }
  }, [token, status, user?.id, queryClient]);

  useEffect(() => {
    const billing = getBillingClient();
    if (!billing.isAvailable()) return;

    const unsubscribe = billing.addCustomerInfoUpdateListener(() => {
      queryClient.invalidateQueries({
        queryKey: ['payments', 'subscription-status'],
      });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && token) {
        queryClient.invalidateQueries({
          queryKey: ['payments', 'subscription-status'],
        });
      }
    };

    const appStateSub = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, [queryClient, token]);
}

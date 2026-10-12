import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';

import type { SubscriptionStatusResponse } from '@/api/billing/types';
import { useSubscriptionSync } from '@/api/billing/use-subscription-sync';

import { DEFAULT_PRODUCT_ID, getBillingClient } from './index';
import {
  BackendSyncPendingError,
  BillingNotConfiguredError,
  NoActiveSubscriptionError,
  PurchaseCancelledError,
} from './types';

export type PurchaseStatus =
  | 'idle'
  | 'opening'
  | 'verifying'
  | 'acknowledging'
  | 'pending_sync'
  | 'success'
  | 'error';

export interface UsePurchasePremiumResult {
  status: PurchaseStatus;
  error: Error | null;
  result: SubscriptionStatusResponse | null;
  buy: (
    packageOrProductId?: PurchasesPackage | string
  ) => Promise<SubscriptionStatusResponse | null>;
  restore: () => Promise<SubscriptionStatusResponse | null>;
  retrySync: () => Promise<SubscriptionStatusResponse | null>;
  reset: () => void;
}

const toPurchaseExecutionError = (e: unknown): Error | null => {
  if (e instanceof PurchaseCancelledError) return null;
  return e instanceof Error ? e : new Error(String(e));
};

export function usePurchasePremium(): UsePurchasePremiumResult {
  const sync = useSubscriptionSync();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<SubscriptionStatusResponse | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  const syncBackend = useCallback(async () => {
    setStatus('verifying');
    try {
      const verified = await sync.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: ['payments', 'subscription-status'],
      });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      setStatus('success');
      setResult(verified);
      return verified;
    } catch {
      const pendingError = new BackendSyncPendingError();
      setError(pendingError);
      setStatus('pending_sync');
      return null;
    }
  }, [queryClient, sync]);

  const buy = useCallback(
    async (
      packageOrProductId: PurchasesPackage | string = DEFAULT_PRODUCT_ID
    ) => {
      if (
        status === 'opening' ||
        status === 'verifying' ||
        status === 'acknowledging'
      ) {
        return null;
      }
      const billing = getBillingClient();
      setError(null);
      setResult(null);
      try {
        if (!billing.isAvailable()) throw new BillingNotConfiguredError();
        setStatus('opening');
        await billing.initialize();
        if (typeof packageOrProductId === 'string') {
          await billing.requestSubscription(packageOrProductId);
        } else {
          await billing.purchasePackage(packageOrProductId);
        }
        return await syncBackend();
      } catch (e) {
        const err = toPurchaseExecutionError(e);
        if (!err) {
          setStatus('idle');
          return null;
        }
        setError(err);
        setStatus('error');
        return null;
      }
    },
    [status, syncBackend]
  );

  const restore = useCallback(async () => {
    if (
      status === 'opening' ||
      status === 'verifying' ||
      status === 'acknowledging'
    ) {
      return null;
    }
    const billing = getBillingClient();
    setError(null);
    setResult(null);
    try {
      if (!billing.isAvailable()) throw new BillingNotConfiguredError();
      setStatus('opening');
      await billing.initialize();
      const purchases = await billing.restorePurchases();
      if (purchases.length === 0) throw new NoActiveSubscriptionError();
      return await syncBackend();
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setStatus('error');
      return null;
    }
  }, [status, syncBackend]);

  const retrySync = useCallback(async () => {
    if (status === 'verifying' || status === 'opening') {
      return null;
    }
    setError(null);
    return syncBackend();
  }, [status, syncBackend]);

  return { status, error, result, buy, restore, retrySync, reset };
}

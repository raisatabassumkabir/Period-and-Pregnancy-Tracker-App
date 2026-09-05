import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { VerifyPurchaseResponse } from '@/api/billing/types';
import { useVerifyPurchase } from '@/api/billing/use-verify-purchase';

import { DEFAULT_PRODUCT_ID, getBillingClient } from './index';
import { BillingNotConfiguredError, PurchaseCancelledError } from './types';

export type PurchaseStatus =
  | 'idle'
  | 'opening'
  | 'verifying'
  | 'acknowledging'
  | 'success'
  | 'error';

export interface UsePurchasePremiumResult {
  status: PurchaseStatus;
  error: Error | null;
  result: VerifyPurchaseResponse | null;
  buy: (productId?: string) => Promise<VerifyPurchaseResponse | null>;
  reset: () => void;
}

export function usePurchasePremium(): UsePurchasePremiumResult {
  const verify = useVerifyPurchase();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<VerifyPurchaseResponse | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  const buy = useCallback(
    async (productId: string = DEFAULT_PRODUCT_ID) => {
      const billing = getBillingClient();
      setError(null);
      setResult(null);
      try {
        if (!billing.isAvailable()) {
          throw new BillingNotConfiguredError();
        }
        setStatus('opening');
        await billing.initialize();
        const purchase = await billing.requestSubscription(productId);

        setStatus('verifying');
        const verified = await verify.mutateAsync({
          subscription_id: purchase.productId,
          purchase_token: purchase.purchaseToken,
        });

        setStatus('acknowledging');
        await billing.acknowledgePurchase(purchase.purchaseToken);

        await queryClient.invalidateQueries({
          queryKey: ['payments', 'subscription-status'],
        });
        await queryClient.invalidateQueries({ queryKey: ['me'] });

        setStatus('success');
        setResult(verified);
        return verified;
      } catch (e) {
        // Dismissing the Play dialog is a user choice, not a failure to surface.
        if (e instanceof PurchaseCancelledError) {
          setStatus('idle');
          return null;
        }
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        setStatus('error');
        return null;
      }
    },
    [queryClient, verify]
  );

  return { status, error, result, buy, reset };
}

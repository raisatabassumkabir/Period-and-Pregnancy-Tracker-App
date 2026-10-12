import { CANONICAL_PRODUCT_IDS } from '@repo/api-contract';
import { useEffect, useState } from 'react';
import {
  PACKAGE_TYPE,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import { getBillingClient } from './index';

export interface UseOfferingsResult {
  offerings: PurchasesOfferings | null;
  currentPackages: PurchasesPackage[];
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  isLoading: boolean;
  error: Error | null;
}

export function useOfferings(): UseOfferingsResult {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOfferings = async () => {
      const billing = getBillingClient();
      if (!billing.isAvailable()) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const data = await billing.getOfferings();
        if (isMounted) {
          setOfferings(data);
          setIsLoading(false);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setIsLoading(false);
        }
      }
    };

    fetchOfferings();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentPackages = offerings?.current?.availablePackages ?? [];
  const monthlyPackage =
    offerings?.current?.monthly ??
    currentPackages.find(
      (p) =>
        p.product.identifier === CANONICAL_PRODUCT_IDS.MONTHLY ||
        p.identifier === CANONICAL_PRODUCT_IDS.MONTHLY ||
        p.packageType === PACKAGE_TYPE.MONTHLY ||
        p.product.identifier.includes('monthly') ||
        p.identifier.includes('monthly')
    ) ??
    null;

  const annualPackage =
    offerings?.current?.annual ??
    currentPackages.find(
      (p) =>
        p.product.identifier === CANONICAL_PRODUCT_IDS.ANNUAL ||
        p.identifier === CANONICAL_PRODUCT_IDS.ANNUAL ||
        p.packageType === PACKAGE_TYPE.ANNUAL ||
        p.product.identifier.includes('annual') ||
        p.product.identifier.includes('yearly') ||
        p.identifier.includes('annual')
    ) ??
    null;

  return {
    offerings,
    currentPackages,
    monthlyPackage,
    annualPackage,
    isLoading,
    error,
  };
}

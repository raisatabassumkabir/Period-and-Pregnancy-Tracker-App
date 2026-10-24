import { useEffect, useState } from 'react';

import { getItem, setItem, STORAGE_KEYS } from '../storage';

/**
 * Whether this install has acknowledged the medical disclaimer.
 * `null` while the stored value loads, so callers render nothing instead of
 * flashing the disclaimer at someone who already accepted it.
 */
export const useMedicalDisclaimerAck = () => {
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);

  useEffect(() => {
    getItem<boolean>(STORAGE_KEYS.MEDICAL_DISCLAIMER_ACK).then((value) => {
      setAcknowledged(value ?? false);
    });
  }, []);

  const acknowledge = async (): Promise<void> => {
    await setItem(STORAGE_KEYS.MEDICAL_DISCLAIMER_ACK, true);
    setAcknowledged(true);
  };

  return { acknowledged, acknowledge } as const;
};

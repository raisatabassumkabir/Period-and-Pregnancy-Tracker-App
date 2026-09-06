import React from 'react';

import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

import { todayDateString } from '../health';

/** `YYYY-MM-DD` -> kicks counted that day. */
type KickCounts = Record<string, number>;

/**
 * Today's kick count, persisted on-device. Fetal movement counting has no
 * backend endpoint yet; when one lands this hook is the only thing that
 * changes.
 */
export function useKickCounter() {
  const [count, setCount] = React.useState(0);
  const [isReady, setIsReady] = React.useState(false);
  const today = todayDateString();

  React.useEffect(() => {
    let active = true;
    getItem<KickCounts>(STORAGE_KEYS.KICK_COUNTS).then((stored) => {
      if (!active) return;
      setCount(stored?.[today] ?? 0);
      setIsReady(true);
    });
    return () => {
      active = false;
    };
  }, [today]);

  const persist = React.useCallback(
    async (next: number) => {
      setCount(next);
      const stored =
        (await getItem<KickCounts>(STORAGE_KEYS.KICK_COUNTS)) ?? {};
      await setItem(STORAGE_KEYS.KICK_COUNTS, { ...stored, [today]: next });
    },
    [today]
  );

  const increment = React.useCallback(
    () => persist(count + 1),
    [count, persist]
  );
  const reset = React.useCallback(() => persist(0), [persist]);

  return { count, increment, reset, isReady };
}

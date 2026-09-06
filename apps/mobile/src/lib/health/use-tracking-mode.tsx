import { useEffect, useState } from 'react';

import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

/**
 * The onboarding choice: which half of the app leads. Mirrors the contract's
 * `ProfileMode` values so a later `PATCH /profiles/` sync is a straight copy.
 */
export type TrackingMode = 'cycle_tracking' | 'pregnancy';

const DEFAULT_MODE: TrackingMode = 'cycle_tracking';

/** Persisted on-device (pattern: `use-is-first-time`). Defaults to cycle tracking. */
export const useTrackingMode = () => {
  const [mode, setModeState] = useState<TrackingMode>(DEFAULT_MODE);

  useEffect(() => {
    getItem<TrackingMode>(STORAGE_KEYS.TRACKING_MODE).then((stored) => {
      if (stored) setModeState(stored);
    });
  }, []);

  const setMode = async (value: TrackingMode) => {
    await setItem(STORAGE_KEYS.TRACKING_MODE, value);
    setModeState(value);
  };

  return [mode, setMode] as const;
};

import { useEffect, useState } from 'react';

import { getItem, setItem } from '../storage';

const IS_FIRST_TIME = 'IS_FIRST_TIME';

export const useIsFirstTime = () => {
  const [isFirstTime, setIsFirstTimeState] = useState<boolean | null>(null);

  useEffect(() => {
    getItem<boolean>(IS_FIRST_TIME).then((value) => {
      setIsFirstTimeState(value ?? true);
    });
  }, []);

  const setIsFirstTime = async (value: boolean) => {
    await setItem(IS_FIRST_TIME, value);
    setIsFirstTimeState(value);
  };

  // Third element: false until the stored value has loaded, so the root
  // layout can hold its redirect instead of flashing onboarding at returners.
  if (isFirstTime === null) {
    return [true, setIsFirstTime, false] as const;
  }
  return [isFirstTime, setIsFirstTime, true] as const;
};

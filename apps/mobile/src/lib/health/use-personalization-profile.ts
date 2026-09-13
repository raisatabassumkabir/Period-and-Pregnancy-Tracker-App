import React from 'react';
import { showMessage } from 'react-native-flash-message';

import type {
  DietPreference,
  MedicalCondition,
  ProfileMode,
} from '@/api/types';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { useHealthStore } from '@/store/useHealthStore';

export interface PersonalizationProfile {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  height: string;
  weight: string;
  averageCycleLength: number;
  averagePeriodDuration: number;
  mode: ProfileMode;
  diet: DietPreference;
  medicalConditions: MedicalCondition[];
  goals: string[];
  source: string;
  hasCompletedOnboarding?: boolean;
  appIntent?: 'myself' | 'partner';
  partnerCode?: string;
}

export const DEFAULT_PERSONALIZATION_PROFILE: PersonalizationProfile = {
  fullName: '',
  dateOfBirth: '',
  age: 28,
  height: '',
  weight: '',
  averageCycleLength: 28,
  averagePeriodDuration: 5,
  mode: 'cycle_tracking',
  diet: 'unspecified',
  medicalConditions: [],
  goals: [],
  source: '',
  hasCompletedOnboarding: false,
  appIntent: 'myself',
  partnerCode: '',
};

export function calculateAge(dobString: string): number {
  if (!dobString) return 28;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 28;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(12, age);
}

export function usePersonalizationProfile() {
  const [profile, setProfile] = React.useState<PersonalizationProfile>(
    DEFAULT_PERSONALIZATION_PROFILE
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const setHealthMode = useHealthStore((s) => s.setMode);

  React.useEffect(() => {
    let active = true;
    getItem<PersonalizationProfile>(STORAGE_KEYS.PERSONALIZATION_PROFILE).then(
      (stored) => {
        if (!active) return;
        if (stored) {
          const computedAge = calculateAge(stored.dateOfBirth);
          setProfile({ ...stored, age: computedAge });
        }
        setIsLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const updateProfile = React.useCallback(
    async (
      updates: Partial<PersonalizationProfile>,
      options?: { silent?: boolean }
    ) => {
      setProfile((current) => {
        const nextDob = updates.dateOfBirth ?? current.dateOfBirth;
        const nextAge = updates.dateOfBirth
          ? calculateAge(nextDob)
          : (updates.age ?? current.age);

        const next: PersonalizationProfile = {
          ...current,
          ...updates,
          dateOfBirth: nextDob,
          age: nextAge,
        };

        setItem(STORAGE_KEYS.PERSONALIZATION_PROFILE, next);

        if (updates.mode) {
          setHealthMode(
            updates.mode === 'pregnancy' ? 'pregnancy' : 'cycle'
          );
        }

        return next;
      });

      if (!options?.silent) {
        showMessage({
          message: 'Personalization profile updated!',
          type: 'success',
        });
      }
    },
    [setHealthMode]
  );

  return {
    profile,
    isLoading,
    updateProfile,
  };
}

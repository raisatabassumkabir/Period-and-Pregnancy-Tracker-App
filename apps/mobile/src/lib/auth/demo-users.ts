import type { PersonalizationProfile } from '@/lib/health/use-personalization-profile';
import { setItem, STORAGE_KEYS } from '@/lib/storage';
import type { AppMode } from '@/store/useHealthStore';
import { useHealthStore } from '@/store/useHealthStore';

export interface DemoUserAccount {
  email: string;
  password: string;
  name: string;
  title: string;
  badge: string;
  description: string;
  mode: AppMode;
  profile: PersonalizationProfile;
}

export const DEMO_PASSWORD = 'Password123!';

export const DEMO_ACCOUNTS: readonly DemoUserAccount[] = [
  {
    email: 'claire.cycle@gmail.com',
    password: DEMO_PASSWORD,
    name: 'Claire Bennett',
    title: 'Regular Cycle Tracking POV',
    badge: 'Cycle Mode',
    description: 'Day 10 in 28-day cycle, follicular phase, ovulation window prediction.',
    mode: 'cycle',
    profile: {
      fullName: 'Claire Bennett',
      dateOfBirth: '1999-04-15',
      age: 26,
      height: '165',
      weight: '58',
      mode: 'cycle_tracking',
      diet: 'unspecified',
      medicalConditions: [],
      goals: ['sync_sex_life', 'symptoms'],
      source: 'Friends or Family',
    },
  },
  {
    email: 'sarah.pregnancy@gmail.com',
    password: DEMO_PASSWORD,
    name: 'Sarah Jenkins',
    title: 'Active Pregnancy Tracking POV',
    badge: 'Pregnancy Mode',
    description: 'Week 18 (2nd Trimester), fetal kick counter, prenatal meal guidance.',
    mode: 'pregnancy',
    profile: {
      fullName: 'Sarah Jenkins',
      dateOfBirth: '1996-08-20',
      age: 30,
      height: '168',
      weight: '64',
      mode: 'pregnancy',
      diet: 'unspecified',
      medicalConditions: [],
      goals: ['symptoms'],
      source: 'Medical professional',
    },
  },
  {
    email: 'maya.pcos@gmail.com',
    password: DEMO_PASSWORD,
    name: 'Maya Chen',
    title: 'TTC & PCOS Management POV',
    badge: 'PCOS / Irregular',
    description: 'PCOS condition, cervical discharge monitoring, hormonal symptom tracking.',
    mode: 'cycle',
    profile: {
      fullName: 'Maya Chen',
      dateOfBirth: '1998-01-12',
      age: 28,
      height: '162',
      weight: '61',
      mode: 'cycle_tracking',
      diet: 'unspecified',
      medicalConditions: ['pcos'],
      goals: ['pcos_endo', 'discharge', 'symptoms'],
      source: 'Google Play or Google search',
    },
  },
];

export function findDemoAccount(email: string): DemoUserAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === normalized);
}

export async function seedDemoUserState(account: DemoUserAccount): Promise<void> {
  await setItem(STORAGE_KEYS.PERSONALIZATION_PROFILE, account.profile);
  await setItem(STORAGE_KEYS.TRACKING_MODE, account.mode === 'pregnancy' ? 'pregnancy' : 'cycle');
  useHealthStore.getState().setMode(account.mode);
}

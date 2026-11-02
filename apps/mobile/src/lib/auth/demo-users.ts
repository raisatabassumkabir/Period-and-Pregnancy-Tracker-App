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
  /** Partner POV: no health data of his own, so no offline cycle seed. */
  isPartner?: boolean;
}

export const DEMO_PASSWORD = 'Password123!';

export const DEMO_ACCOUNTS: readonly DemoUserAccount[] = [
  {
    email: 'claire.cycle@gmail.com',
    password: DEMO_PASSWORD,
    name: 'Claire Bennett',
    title: 'Regular Cycle Tracking POV',
    badge: 'Cycle Mode',
    description:
      'Day 10 in 28-day cycle, follicular phase, ovulation window prediction.',
    mode: 'cycle',
    profile: {
      fullName: 'Claire Bennett',
      dateOfBirth: '1999-04-15',
      age: 26,
      height: '165',
      weight: '58',
      averageCycleLength: 28,
      averagePeriodDuration: 5,
      mode: 'cycle_tracking',
      diet: 'unspecified',
      medicalConditions: [],
      goals: ['sync_sex_life', 'symptoms'],
      source: 'Friends or Family',
      hasCompletedOnboarding: true,
    },
  },
  {
    email: 'sarah.pregnancy@gmail.com',
    password: DEMO_PASSWORD,
    name: 'Sarah Jenkins',
    title: 'Active Pregnancy Tracking POV',
    badge: 'Pregnancy Mode',
    description:
      'Week 18 (2nd Trimester), fetal kick counter, prenatal meal guidance.',
    mode: 'pregnancy',
    profile: {
      fullName: 'Sarah Jenkins',
      dateOfBirth: '1996-08-20',
      age: 30,
      height: '168',
      weight: '64',
      averageCycleLength: 28,
      averagePeriodDuration: 5,
      mode: 'pregnancy',
      diet: 'unspecified',
      medicalConditions: [],
      goals: ['symptoms'],
      source: 'Medical professional',
      hasCompletedOnboarding: true,
    },
  },
  {
    email: 'maya.pcos@gmail.com',
    password: DEMO_PASSWORD,
    name: 'Maya Chen',
    title: 'TTC & PCOS Management POV',
    badge: 'PCOS / Irregular',
    description:
      'PCOS condition, cervical discharge monitoring, hormonal symptom tracking.',
    mode: 'cycle',
    profile: {
      fullName: 'Maya Chen',
      dateOfBirth: '1998-01-12',
      age: 28,
      height: '162',
      weight: '61',
      averageCycleLength: 32,
      averagePeriodDuration: 5,
      mode: 'cycle_tracking',
      diet: 'unspecified',
      medicalConditions: ['pcos'],
      goals: ['pcos_endo', 'discharge', 'symptoms'],
      source: 'Google Play or Google search',
      hasCompletedOnboarding: true,
    },
  },
  {
    email: 'daniel.partner@gmail.com',
    password: DEMO_PASSWORD,
    name: 'Daniel Bennett',
    title: 'Partner POV',
    badge: 'Partner',
    description:
      'Pairs with Claire using her link or code, then sees her phase, period countdown and ideas to support her.',
    mode: 'cycle',
    isPartner: true,
    profile: {
      fullName: 'Daniel Bennett',
      dateOfBirth: '1997-02-03',
      age: 29,
      height: '178',
      weight: '76',
      averageCycleLength: 28,
      averagePeriodDuration: 5,
      mode: 'cycle_tracking',
      diet: 'unspecified',
      medicalConditions: [],
      goals: [],
      source: 'Friends or Family',
      hasCompletedOnboarding: true,
      appIntent: 'partner',
    },
  },
];

export const CLEAN_TEST_PASSWORD = 'HappyWomen2026!';

export interface CleanTestAccount {
  email: string;
  password: string;
  name: string;
  badge: string;
  description: string;
}

export const CLEAN_TEST_ACCOUNTS: readonly CleanTestAccount[] = [
  {
    email: 'test1@happywomen.com',
    password: CLEAN_TEST_PASSWORD,
    name: 'Clean Test User 1',
    badge: 'Fresh User 1',
    description:
      'Fresh slate auth account. Zero health profile. Forces Onboarding Step 1.',
  },
  {
    email: 'test2@happywomen.com',
    password: CLEAN_TEST_PASSWORD,
    name: 'Clean Test User 2',
    badge: 'Fresh User 2',
    description:
      'Fresh slate auth account. Zero health profile. Forces Onboarding Step 1.',
  },
  {
    email: 'test3@happywomen.com',
    password: CLEAN_TEST_PASSWORD,
    name: 'Clean Test User 3',
    badge: 'Fresh User 3',
    description:
      'Fresh slate auth account. Zero health profile. Forces Onboarding Step 1.',
  },
];

export function isCleanTestAccount(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return CLEAN_TEST_ACCOUNTS.some(
    (acc) => acc.email.toLowerCase() === normalized
  );
}

export function findDemoAccount(email: string): DemoUserAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === normalized);
}

export async function seedDemoUserState(
  account: DemoUserAccount
): Promise<void> {
  await setItem(STORAGE_KEYS.PERSONALIZATION_PROFILE, account.profile);
  await setItem(
    STORAGE_KEYS.TRACKING_MODE,
    account.mode === 'pregnancy' ? 'pregnancy' : 'cycle'
  );
  useHealthStore.getState().setMode(account.mode);
}

export async function clearUserStateForCleanTest(): Promise<void> {
  // Clear any existing stored profile so the user is guaranteed to start on Screen 1
  await setItem(STORAGE_KEYS.PERSONALIZATION_PROFILE, null);
  await setItem(STORAGE_KEYS.TRACKING_MODE, 'cycle');
  useHealthStore.getState().setMode('cycle');
}

const SEEDED_DEMO_TOKEN_PREFIX = 'demo-';
const PARTNER_DEMO_TOKEN_PREFIX = 'demo-partner-';
const CLEAN_TEST_TOKEN_PREFIX = 'clean-test-';

export interface OfflineTokens {
  access: string;
  refresh: string;
}

/**
 * Fallback ONLY for when the server can't be reached: a demo or clean-test
 * login with the right password still opens the app, offline. These tokens
 * are fake, so nothing that needs the server (e.g. partner pairing) works.
 * Every demo account is also a real server account
 * (apps/api: `manage.py seed_demo_accounts`), which is the normal path.
 */
export function offlineTokensFor(
  email: string,
  password: string
): OfflineTokens | null {
  if (isCleanTestAccount(email) && password === CLEAN_TEST_PASSWORD) {
    return {
      access: `${CLEAN_TEST_TOKEN_PREFIX}access-token`,
      refresh: `${CLEAN_TEST_TOKEN_PREFIX}refresh-token`,
    };
  }
  const demo = findDemoAccount(email);
  if (!demo || password !== demo.password) return null;
  const prefix = demo.isPartner
    ? PARTNER_DEMO_TOKEN_PREFIX
    : SEEDED_DEMO_TOKEN_PREFIX;
  return {
    access: `${prefix}access-token-${demo.mode}`,
    refresh: `${prefix}refresh-token-${demo.mode}`,
  };
}

export function isDemoToken(token: string | undefined | null): boolean {
  if (!token) return false;
  return (
    token.startsWith(SEEDED_DEMO_TOKEN_PREFIX) ||
    token.startsWith(CLEAN_TEST_TOKEN_PREFIX)
  );
}

/**
 * Only the pre-seeded demo accounts get the 3-cycle offline seed. Clean test
 * accounts are offline too but stand in for brand-new users, so they must see
 * the empty state and the "last period" prompt like a real new account.
 */
export function isSeededDemoToken(token: string | undefined | null): boolean {
  if (!token || token.startsWith(PARTNER_DEMO_TOKEN_PREFIX)) return false;
  return token.startsWith(SEEDED_DEMO_TOKEN_PREFIX);
}

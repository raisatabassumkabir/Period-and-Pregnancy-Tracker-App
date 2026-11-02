import { create } from 'zustand';

import { getItem, removeItem, setItem, STORAGE_KEYS } from '@/lib/storage';

import { isPartnerCode } from './share-invite';

/**
 * A partner code that arrived through an invite link (or onboarding) before
 * it could be redeemed: redeeming needs an account. Held in memory at once
 * (the invite-link route sets it in the same commit the root layout
 * redirects in) and persisted so it survives sign-up.
 */
interface PendingCodeState {
  code: string | null;
  hydrated: boolean;
  set: (code: string) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
}

function normalise(code: string): string {
  return code.trim().toUpperCase();
}

export const usePendingPartnerCode = create<PendingCodeState>((set, get) => ({
  code: null,
  hydrated: false,
  set: (code) => {
    if (!isPartnerCode(code)) return;
    set({ code: normalise(code), hydrated: true });
    void setItem(STORAGE_KEYS.PENDING_PARTNER_CODE, normalise(code));
  },
  clear: () => {
    set({ code: null });
    void removeItem(STORAGE_KEYS.PENDING_PARTNER_CODE);
  },
  hydrate: async () => {
    if (get().hydrated) return;
    const stored = await getItem<string>(STORAGE_KEYS.PENDING_PARTNER_CODE);
    set({
      code: get().code ?? (isPartnerCode(stored) ? stored : null),
      hydrated: true,
    });
  },
}));

export async function savePendingPartnerCode(code: string): Promise<void> {
  usePendingPartnerCode.getState().set(code);
}

export async function readPendingPartnerCode(): Promise<string | null> {
  await usePendingPartnerCode.getState().hydrate();
  return usePendingPartnerCode.getState().code;
}

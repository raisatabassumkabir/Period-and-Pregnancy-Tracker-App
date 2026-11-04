import React from 'react';
import { create } from 'zustand';

import { usePartnerLink, useSharedStatuses } from '@/api/sharing';
import { DEMO_SHARED_STATUS } from '@/api/sharing/use-shared-status';
import type { PartnerLink } from '@/api/types';
import { useAuth } from '@/lib/auth';
import { isDemoToken } from '@/lib/auth/demo-users';
import { usePersonalizationProfile } from '@/lib/health';
import { translate } from '@/lib/i18n';
import {
  cancelTaggedReminders,
  replaceTaggedReminders,
} from '@/lib/reminders/notifications';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

import type { PartnerNudgeSettings } from './partner-nudges';
import {
  DEFAULT_PARTNER_NUDGE_SETTINGS,
  planPartnerNudges,
} from './partner-nudges';
import { derivePartnerView } from './partner-view';

/** The offline (server unreachable) Daniel session: linked to Claire on the phone only. */
export const DEMO_PARTNER_LINK: PartnerLink = {
  id: 'demo-link-daniel-claire',
  role: 'partner',
  other_name: 'Claire',
  share_fertile_window: true,
  share_pregnancy: true,
  created_at: '2026-11-01T00:00:00Z',
};

/** Notification tag: cancelling partner nudges never touches her own reminders. */
export const PARTNER_NUDGE_TAG = 'partner-nudge';

interface PartnerNudgeState {
  settings: PartnerNudgeSettings;
  hydrated: boolean;
  update: (changes: Partial<PartnerNudgeSettings>) => void;
  hydrate: () => Promise<void>;
}

export const usePartnerNudgeSettings = create<PartnerNudgeState>(
  (set, get) => ({
    settings: DEFAULT_PARTNER_NUDGE_SETTINGS,
    hydrated: false,
    update: (changes) => {
      const settings = { ...get().settings, ...changes };
      set({ settings });
      setItem(STORAGE_KEYS.PARTNER_NUDGES, settings).catch(() => {
        // In-memory value still drives this session's schedule.
      });
    },
    hydrate: async () => {
      if (get().hydrated) return;
      const stored = await getItem<PartnerNudgeSettings>(
        STORAGE_KEYS.PARTNER_NUDGES
      );
      set({
        settings: { ...DEFAULT_PARTNER_NUDGE_SETTINGS, ...(stored ?? {}) },
        hydrated: true,
      });
    },
  })
);

/** The partner's view of her, or null for anyone who isn't a linked partner. */
export function usePartnerSide() {
  const serverLink = usePartnerLink();
  const token = useAuth((state) => state.token);
  const { profile } = usePersonalizationProfile();
  const isDemo = isDemoToken(token?.access);
  const isDemoPartner =
    isDemo &&
    (token?.access?.includes('partner') || profile.appIntent === 'partner');
  const link = serverLink ?? (isDemoPartner ? DEMO_PARTNER_LINK : null);
  const isPartner = link?.role === 'partner';
  const { data } = useSharedStatuses({ enabled: isPartner && !isDemo });
  const status = isPartner
    ? isDemo
      ? DEMO_SHARED_STATUS
      : (data?.[0] ?? null)
    : null;
  return { link, isPartner, status, view: derivePartnerView(status) };
}

/**
 * Re-plans the partner's nudges whenever her shared status changes (it is
 * refetched on app focus). Mounted once in the signed-in shell.
 */
export function usePartnerNudgeSync(): void {
  const { isPartner, status, link } = usePartnerSide();
  const settings = usePartnerNudgeSettings((state) => state.settings);
  const hydrated = usePartnerNudgeSettings((state) => state.hydrated);
  const hydrate = usePartnerNudgeSettings((state) => state.hydrate);
  const name = link?.other_name || translate('partner.home.her_name_fallback');

  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (!hydrated) return;
    const plan =
      isPartner && status
        ? planPartnerNudges({
            view: derivePartnerView(status),
            settings,
            cycleLength: status.cycle_length,
          })
        : [];
    const reminders = plan.map((item) => ({
      kind: item.kind,
      fireAt: item.fireAt,
      title: translate(item.titleKey, { name }),
      body: translate(item.bodyKey, { name }),
    }));
    const sync = reminders.length
      ? replaceTaggedReminders(PARTNER_NUDGE_TAG, reminders)
      : cancelTaggedReminders(PARTNER_NUDGE_TAG);
    sync.catch((error: unknown) => {
      console.warn('Could not update partner reminders', error);
    });
  }, [hydrated, settings, isPartner, status, name]);
}

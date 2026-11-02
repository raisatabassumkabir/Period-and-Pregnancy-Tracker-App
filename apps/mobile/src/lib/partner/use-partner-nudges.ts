import React from 'react';
import { create } from 'zustand';

import { usePartnerLink, useSharedStatuses } from '@/api/sharing';
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
  const link = usePartnerLink();
  const isPartner = link?.role === 'partner';
  const { data } = useSharedStatuses({ enabled: isPartner });
  const status = isPartner ? (data?.[0] ?? null) : null;
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

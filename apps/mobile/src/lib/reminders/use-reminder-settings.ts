import { create } from 'zustand';

import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

import type { ReminderSettings } from './reminder-schedule';
import { DEFAULT_REMINDER_SETTINGS } from './reminder-schedule';

interface ReminderSettingsState {
  settings: ReminderSettings;
  /** False until storage has been read, so nothing reschedules on defaults. */
  hydrated: boolean;
  update: (changes: Partial<ReminderSettings>) => void;
  hydrate: () => Promise<void>;
}

/**
 * Shared store (the header bell, the sheet and the scheduler all read it), so
 * a change in the sheet reaches the scheduler without a remount.
 */
export const useReminderSettings = create<ReminderSettingsState>(
  (set, get) => ({
    settings: DEFAULT_REMINDER_SETTINGS,
    hydrated: false,
    update: (changes) => {
      const settings = { ...get().settings, ...changes };
      set({ settings });
      setItem(STORAGE_KEYS.REMINDER_SETTINGS, settings).catch(() => {
        // Preference write failed: the in-memory value still drives the UI
        // and the schedule for this session.
      });
    },
    hydrate: async () => {
      if (get().hydrated) return;
      const stored = await getItem<ReminderSettings>(
        STORAGE_KEYS.REMINDER_SETTINGS
      );
      set({
        settings: { ...DEFAULT_REMINDER_SETTINGS, ...(stored ?? {}) },
        hydrated: true,
      });
    },
  })
);

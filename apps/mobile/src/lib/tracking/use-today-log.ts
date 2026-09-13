import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { useDailyLogs, useSaveDailyLog } from '@/api/cycles';
import type { DailyLog, Flow, Mood, Symptom } from '@/api/cycles/types';
import type { PaginateQuery } from '@/api/types';
import { isProblemDetail } from '@/api/types';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { useHealthStore } from '@/store/useHealthStore';

import { todayDateString } from '../health';
import type { Discharge, DischargeLogs } from './discharge';

export interface DailyLogDraft {
  flow: Flow;
  mood: Mood;
  symptoms: Symptom[];
  notes: string;
  /** App-only; persisted in the encrypted store, not sent to the API. */
  discharge: Discharge;
  intercourseLogged: boolean;
  contraceptionUsed: string[];
}

const EMPTY_DRAFT: DailyLogDraft = {
  flow: 'none',
  mood: 'unspecified',
  symptoms: [],
  notes: '',
  discharge: 'unspecified',
  intercourseLogged: false,
  contraceptionUsed: [],
};

/**
 * Today's log as an editable draft. Persists locally to MMKV for offline and
 * instant UI updates across the app (Calendar, Dashboard, Insights), and syncs
 * with the backend server when available.
 */
export function useTodayLog() {
  const today = todayDateString();
  const queryClient = useQueryClient();
  const logsQuery = useDailyLogs();
  const saveMutation = useSaveDailyLog();

  const [localLogs, setLocalLogs] = React.useState<Record<string, DailyLog>>({});

  React.useEffect(() => {
    getItem<Record<string, DailyLog>>(STORAGE_KEYS.LOCAL_DAILY_LOGS).then((stored) => {
      if (stored) setLocalLogs(stored);
    });
  }, []);

  const serverLogs = logsQuery.data?.results ?? [];
  const existing =
    serverLogs.find((log) => log.date === today) ?? localLogs[today];

  const [draft, setDraft] = React.useState<DailyLogDraft>(EMPTY_DRAFT);
  const [hydratedFrom, setHydratedFrom] = React.useState<string | null>(null);

  // Seed the draft once today's log arrives, without clobbering edits made
  // while the query was still in flight.
  if (existing && hydratedFrom !== existing.id) {
    setHydratedFrom(existing.id);
    setDraft((current) => ({
      flow: existing.flow,
      mood: existing.mood,
      symptoms: existing.symptoms,
      notes: existing.notes,
      discharge: current.discharge,
      intercourseLogged: existing.intercourse_logged ?? false,
      contraceptionUsed: existing.contraception_used ?? [],
    }));
  }

  React.useEffect(() => {
    let active = true;
    getItem<DischargeLogs>(STORAGE_KEYS.DISCHARGE_LOGS).then((stored) => {
      const discharge = stored?.[today];
      if (!active || !discharge) return;
      setDraft((current) => ({ ...current, discharge }));
    });
    return () => {
      active = false;
    };
  }, [today]);

  const toggleSymptom = React.useCallback((symptom: Symptom) => {
    setDraft((current) => ({
      ...current,
      symptoms: current.symptoms.includes(symptom)
        ? current.symptoms.filter((entry) => entry !== symptom)
        : [...current.symptoms, symptom],
    }));
  }, []);

  const setFlow = React.useCallback(
    (flow: Flow) => setDraft((current) => ({ ...current, flow })),
    []
  );
  const setMood = React.useCallback(
    (mood: Mood) => setDraft((current) => ({ ...current, mood })),
    []
  );
  const setDischarge = React.useCallback(
    (discharge: Discharge) =>
      setDraft((current) => ({ ...current, discharge })),
    []
  );
  const setSexualHealth = React.useCallback(
    (intercourseLogged: boolean, contraceptionUsed: string[]) =>
      setDraft((current) => ({
        ...current,
        intercourseLogged,
        contraceptionUsed,
      })),
    []
  );

  const save = React.useCallback(async () => {
    const { discharge, intercourseLogged, contraceptionUsed, ...serverFields } = draft;

    const newLog: DailyLog = {
      id: existing?.id ?? `local-${Date.now()}`,
      date: today,
      flow: serverFields.flow,
      mood: serverFields.mood,
      symptoms: serverFields.symptoms,
      notes: serverFields.notes,
      intercourse_logged: intercourseLogged,
      contraception_used: contraceptionUsed,
      temperature_celsius: existing?.temperature_celsius ?? null,
      created_at: existing?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save locally to MMKV encrypted store
    const storedLocalLogs =
      (await getItem<Record<string, DailyLog>>(STORAGE_KEYS.LOCAL_DAILY_LOGS)) ?? {};
    const updatedLocalLogs = { ...storedLocalLogs, [today]: newLog };
    await setItem(STORAGE_KEYS.LOCAL_DAILY_LOGS, updatedLocalLogs);
    setLocalLogs(updatedLocalLogs);

    // Save discharge
    const storedDischarge =
      (await getItem<DischargeLogs>(STORAGE_KEYS.DISCHARGE_LOGS)) ?? {};
    await setItem(STORAGE_KEYS.DISCHARGE_LOGS, {
      ...storedDischarge,
      [today]: discharge,
    });

    // 2. Optimistically update React Query cache so Dashboard & Calendar update immediately
    queryClient.setQueryData<PaginateQuery<DailyLog>>(['daily-logs'], (old) => {
      const currentResults = old?.results ?? [];
      const filtered = currentResults.filter((l) => l.date !== today);
      return {
        count: (old?.count ?? 0) + (currentResults.some((l) => l.date === today) ? 0 : 1),
        next: old?.next ?? null,
        previous: old?.previous ?? null,
        results: [newLog, ...filtered],
      };
    });

    // 3. Sync to health store for instant UI feedback
    const healthStore = useHealthStore.getState();
    if (healthStore.toggleSymptom) {
      serverFields.symptoms.forEach((sym) => {
        const found = healthStore.symptoms.find((s) =>
          s.name.toLowerCase().includes(sym.replace('_', ' '))
        );
        if (found && !found.logged) {
          healthStore.toggleSymptom(found.id);
        }
      });
    }

    // 4. Try syncing with backend server if available
    let saved = newLog;
    try {
      saved = await saveMutation.mutateAsync({
        id: existing?.id && !existing.id.startsWith('local-') ? existing.id : undefined,
        date: today,
        ...serverFields,
        intercourse_logged: intercourseLogged,
        contraception_used: contraceptionUsed,
      });
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
    } catch {
      // Local save already succeeded; offline/demo fallback active
    }

    return saved;
  }, [draft, existing?.id, existing?.created_at, existing?.temperature_celsius, queryClient, saveMutation, today]);

  const errorBody = saveMutation.error?.response?.data;

  return {
    draft,
    setFlow,
    setMood,
    setDischarge,
    setSexualHealth,
    toggleSymptom,
    save,
    isSaving: saveMutation.isPending,
    isLoading: logsQuery.isPending,
    hasExistingLog: existing !== undefined,
    saveError: isProblemDetail(errorBody) ? errorBody.detail : undefined,
  };
}

import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { useDailyLogs, useSaveDailyLog } from '@/api/cycles';
import type { Flow, Mood, Symptom } from '@/api/cycles/types';
import { isProblemDetail } from '@/api/types';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

import { todayDateString } from '../health';
import type { Discharge, DischargeLogs } from './discharge';

export interface DailyLogDraft {
  flow: Flow;
  mood: Mood;
  symptoms: Symptom[];
  notes: string;
  /** App-only; persisted in the encrypted store, not sent to the API. */
  discharge: Discharge;
}

const EMPTY_DRAFT: DailyLogDraft = {
  flow: 'none',
  mood: 'unspecified',
  symptoms: [],
  notes: '',
  discharge: 'unspecified',
};

/**
 * Today's log as an editable draft. The server allows one log per calendar
 * day, so an existing entry is PATCHed by id rather than POSTed again.
 * Discharge has no server column yet and rides along in local storage.
 */
export function useTodayLog() {
  const today = todayDateString();
  const queryClient = useQueryClient();
  const logsQuery = useDailyLogs();
  const saveMutation = useSaveDailyLog();

  const existing = logsQuery.data?.results.find((log) => log.date === today);

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

  const save = React.useCallback(async () => {
    const { discharge, ...serverFields } = draft;
    const saved = await saveMutation.mutateAsync({
      id: existing?.id,
      date: today,
      ...serverFields,
    });
    const stored =
      (await getItem<DischargeLogs>(STORAGE_KEYS.DISCHARGE_LOGS)) ?? {};
    await setItem(STORAGE_KEYS.DISCHARGE_LOGS, {
      ...stored,
      [today]: discharge,
    });
    await queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
    return saved;
  }, [draft, existing?.id, queryClient, saveMutation, today]);

  const errorBody = saveMutation.error?.response?.data;

  return {
    draft,
    setFlow,
    setMood,
    setDischarge,
    toggleSymptom,
    save,
    isSaving: saveMutation.isPending,
    isLoading: logsQuery.isPending,
    hasExistingLog: existing !== undefined,
    // `detail` is a safe human sentence on every problem body.
    saveError: isProblemDetail(errorBody) ? errorBody.detail : undefined,
  };
}

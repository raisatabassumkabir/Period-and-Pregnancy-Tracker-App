import React from 'react';

import { useCycles, useDailyLogs } from '@/api/cycles';
import type { Symptom } from '@/api/cycles/types';
import { usePregnancies } from '@/api/pregnancy';
import {
  DEMO_CYCLES,
  DEMO_DAILY_LOGS,
  DEMO_PREGNANCY,
  deriveCycleInsights,
  derivePregnancyProgress,
  withDemoFallback,
} from '@/lib/health';
import { useKickCounter } from '@/lib/tracking';

import { getAssistantClient } from './index';
import type { AssistantContext } from './types';

/** Enough to answer "what have I logged lately" without flooding the reply. */
const RECENT_LOG_COUNT = 3;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export const WELCOME_MESSAGE =
  "Hi! I'm your on-device guide. Ask about your next period, cycle day, " +
  "pregnancy week, due date, recent symptoms, today's kicks, or what to eat.";

function recentSymptomsFrom(
  logs: readonly { symptoms: readonly Symptom[] }[]
): Symptom[] {
  const unique = new Set<Symptom>();
  logs.slice(0, RECENT_LOG_COUNT).forEach((log) => {
    log.symptoms.forEach((symptom) => unique.add(symptom));
  });
  return Array.from(unique);
}

/** Assembles the read-only snapshot the assistant is allowed to reason over. */
function useAssistantContext(): AssistantContext {
  const cyclesQuery = useCycles();
  const logsQuery = useDailyLogs();
  const pregnanciesQuery = usePregnancies();
  const { count: kicksToday } = useKickCounter();

  const cycles = withDemoFallback(cyclesQuery, DEMO_CYCLES);
  const logs = withDemoFallback(logsQuery, DEMO_DAILY_LOGS);
  const pregnancies = withDemoFallback(pregnanciesQuery, [DEMO_PREGNANCY]);
  const pregnancy = pregnancies.rows.find((row) => row.status === 'active');

  return React.useMemo<AssistantContext>(
    () => ({
      cycleInsights: deriveCycleInsights(cycles.rows),
      pregnancyProgress: derivePregnancyProgress(pregnancy),
      dueDate: pregnancy?.due_date ?? null,
      recentSymptoms: recentSymptomsFrom(logs.rows),
      kicksToday,
      isDemoData: cycles.isDemo || logs.isDemo || pregnancies.isDemo,
    }),
    [
      cycles.rows,
      cycles.isDemo,
      logs.rows,
      logs.isDemo,
      pregnancy,
      pregnancies.isDemo,
      kicksToday,
    ]
  );
}

/** Chat thread state plus the send action, backed by the assistant facade. */
export function useAssistantChat() {
  const context = useAssistantContext();
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME_MESSAGE },
  ]);
  const [isSending, setIsSending] = React.useState(false);
  const nextId = React.useRef(0);

  const send = React.useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      nextId.current += 1;
      const userMessage: ChatMessage = {
        id: `user-${nextId.current}`,
        role: 'user',
        text: trimmed,
      };
      setMessages((current) => [...current, userMessage]);
      setIsSending(true);

      const reply = await getAssistantClient().ask(trimmed, context);

      nextId.current += 1;
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${nextId.current}`,
          role: 'assistant',
          text: reply.text,
        },
      ]);
      setIsSending(false);
    },
    [context]
  );

  return { messages, send, isSending, context };
}

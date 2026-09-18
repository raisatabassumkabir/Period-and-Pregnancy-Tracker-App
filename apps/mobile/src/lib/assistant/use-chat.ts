import { useMutation } from '@tanstack/react-query';
import React from 'react';

import { client } from '@/api/common';
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

import { getAssistantClient } from './client';
import type { AssistantContext } from './types';

const RECENT_LOG_COUNT = 3;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export const WELCOME_MESSAGE =
  "Hi! I'm your health guide. Ask about your next period, cycle day, " +
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
export function useAssistantContext(): AssistantContext {
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

interface ChatApiResponse {
  reply?: string;
  answer?: string;
  text?: string;
  message?: string;
}

/**
 * Production useChat hook wired to Django /api/v1/assistant/chat/ endpoint
 * using @tanstack/react-query with optimistic UI and graceful offline fallback.
 */
export function useChat() {
  const context = useAssistantContext();
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME_MESSAGE },
  ]);
  const messageCounter = React.useRef(1);

  const chatMutation = useMutation({
    mutationFn: async (userQuery: string): Promise<string> => {
      try {
        const response = await client.post<ChatApiResponse>(
          '/api/v1/assistant/chat/',
          {
            query: userQuery,
            context: {
              dueDate: context.dueDate,
              kicksToday: context.kicksToday,
              recentSymptoms: context.recentSymptoms,
            },
          }
        );
        const data = response.data;
        const answer =
          data?.reply ||
          data?.answer ||
          data?.text ||
          data?.message;

        if (answer) {
          return answer;
        }
        // If response is empty or unhandled shape, fallback to local guide
        const localReply = await getAssistantClient().ask(userQuery, context);
        return localReply.text;
      } catch {
        // Offline or backend unavailable fallback: use local guideline facade
        const localReply = await getAssistantClient().ask(userQuery, context);
        return localReply.text;
      }
    },
  });

  const send = React.useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || chatMutation.isPending) return;

      messageCounter.current += 1;
      const userMessageId = `user-${Date.now()}-${messageCounter.current}`;
      const optimisticMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        text: trimmed,
      };

      // 1. Optimistic UI update: push message immediately to local state
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        // 2. POST query to Django assistant endpoint via TanStack Query mutation
        const replyText = await chatMutation.mutateAsync(trimmed);

        messageCounter.current += 1;
        const assistantMessageId = `assistant-${Date.now()}-${messageCounter.current}`;
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            text: replyText,
          },
        ]);
      } catch {
        messageCounter.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-err-${Date.now()}`,
            role: 'assistant',
            text: "I'm having trouble connecting right now. Please try again in a moment.",
          },
        ]);
      }
    },
    [chatMutation, context]
  );

  return {
    messages,
    send,
    isSending: chatMutation.isPending,
    context,
    error: chatMutation.error,
  };
}

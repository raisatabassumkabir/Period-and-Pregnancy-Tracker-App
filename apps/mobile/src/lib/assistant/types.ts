import type { Symptom } from '@/api/cycles/types';
import type { CycleInsights, PregnancyProgress } from '@/lib/health';

/**
 * Everything the on-device guide is allowed to read. Assembled once per
 * screen render from the user's (or the demo) cycle/pregnancy/tracking data —
 * never fetched by the assistant itself, which stays fully offline.
 */
export interface AssistantContext {
  cycleInsights: CycleInsights | null;
  pregnancyProgress: PregnancyProgress | null;
  /** `YYYY-MM-DD` of the active pregnancy's due date, or `null`. */
  dueDate: string | null;
  recentSymptoms: readonly Symptom[];
  kicksToday: number;
  /** True when any part of `context` is standing in for unreachable data. */
  isDemoData: boolean;
}

export interface AssistantReply {
  text: string;
}

/**
 * The assistant facade. `localGuide` is the only implementation today — this
 * interface exists so a future remote/LLM client can be swapped in the same
 * way `BillingClient` is (`src/lib/billing/index.ts`).
 */
export interface AssistantClient {
  ask(question: string, context: AssistantContext): Promise<AssistantReply>;
}

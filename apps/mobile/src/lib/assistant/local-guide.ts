import { formatCalendarDate } from '@/lib/health';

import type {
  AssistantClient,
  AssistantContext,
  AssistantReply,
} from './types';

/** Every rule-based answer is general guidance, never a diagnosis. */
const DISCLAIMER = 'General guidance, not medical advice.';

/** Told apart from a real answer so demo data is never mistaken for the user's own. */
const DEMO_SUFFIX =
  '…(based on demo data — start the backend to use your own.)';

const EXAMPLE_QUESTIONS = [
  'When is my next period?',
  'What cycle day am I on?',
  'How far along am I?',
  'When is my due date?',
  'What symptoms have I logged?',
  'How many kicks today?',
  'What should I eat?',
] as const;

type IntentHandler = (context: AssistantContext) => string;

function pluraliseDays(count: number): string {
  return `${count} ${count === 1 ? 'day' : 'days'}`;
}

function answerNextPeriod(context: AssistantContext): string {
  const { cycleInsights } = context;
  if (!cycleInsights) {
    return 'Log at least one period before I can predict the next one.';
  }
  const date = formatCalendarDate(cycleInsights.nextPeriodDate);
  const days = cycleInsights.daysUntilNextPeriod;

  // A date in the past must not be phrased as "in -11 day(s)".
  if (days < 0) {
    return `Your period was expected around ${date} — that's ${pluraliseDays(-days)} ago.`;
  }
  if (days === 0) {
    return `Your next period is expected today, around ${date}.`;
  }
  return `Your next period is expected around ${date}, in ${pluraliseDays(days)}.`;
}

function answerCycleDay(context: AssistantContext): string {
  const { cycleInsights } = context;
  if (!cycleInsights) {
    return 'Log at least one period before I can tell you your cycle day.';
  }
  return `You're on day ${cycleInsights.currentDay} of a typical ${cycleInsights.cycleLengthDays}-day cycle.`;
}

function answerPregnancyProgress(context: AssistantContext): string {
  const { pregnancyProgress } = context;
  if (!pregnancyProgress) {
    return "There's no active pregnancy set up yet.";
  }
  return `You're in week ${pregnancyProgress.week}, trimester ${pregnancyProgress.trimester}.`;
}

function answerDueDate(context: AssistantContext): string {
  const { dueDate, pregnancyProgress } = context;
  if (!dueDate) {
    return "There's no active pregnancy set up yet, so there's no due date to share.";
  }
  const formatted = formatCalendarDate(dueDate);
  const days = pregnancyProgress?.daysUntilDue;
  const remaining =
    days == null
      ? ''
      : days > 0
        ? ` (${pluraliseDays(days)} to go)`
        : days === 0
          ? ' (that’s today)'
          : ` (${pluraliseDays(-days)} ago)`;
  return `Your due date is ${formatted}${remaining}.`;
}

function answerSymptoms(context: AssistantContext): string {
  const { recentSymptoms } = context;
  if (recentSymptoms.length === 0) {
    return "You haven't logged any symptoms recently.";
  }
  const list = recentSymptoms
    .map((symptom) => symptom.replace(/_/g, ' '))
    .join(', ');
  return `Recently logged symptoms: ${list}.`;
}

function answerKicks(context: AssistantContext): string {
  return `You've logged ${context.kicksToday} kick(s) today.`;
}

function answerDiet(): string {
  return 'Check the Diet tab for meal ideas tailored to your current trimester.';
}

function answerHelp(): string {
  return `I can answer questions like: ${EXAMPLE_QUESTIONS.join(' · ')}`;
}

interface Intent {
  name: string;
  pattern: RegExp;
  /** Health answers carry the "not medical advice" disclaimer; logistics don't. */
  isHealthIntent: boolean;
  handler: IntentHandler;
}

/** Exported so the test suite can assert every pattern resolves to its handler. */
export const INTENTS: readonly Intent[] = [
  {
    name: 'next-period',
    pattern: /next period|when.*period/,
    isHealthIntent: true,
    handler: answerNextPeriod,
  },
  {
    name: 'cycle-day',
    pattern: /cycle day|what day/,
    isHealthIntent: true,
    handler: answerCycleDay,
  },
  {
    name: 'pregnancy-progress',
    pattern: /week|trimester|how far/,
    isHealthIntent: true,
    handler: answerPregnancyProgress,
  },
  {
    name: 'due-date',
    pattern: /due date/,
    isHealthIntent: true,
    handler: answerDueDate,
  },
  {
    name: 'symptoms',
    pattern: /symptom/,
    isHealthIntent: true,
    handler: answerSymptoms,
  },
  {
    name: 'kicks',
    pattern: /kick|movement/,
    isHealthIntent: false,
    handler: answerKicks,
  },
  {
    name: 'diet',
    pattern: /diet|\beat\b|food/,
    isHealthIntent: false,
    handler: answerDiet,
  },
];

function normalize(question: string): string {
  return question.trim().toLowerCase();
}

function matchIntent(question: string): Intent | undefined {
  const normalized = normalize(question);
  return INTENTS.find((intent) => intent.pattern.test(normalized));
}

function composeReply(
  intent: Intent | undefined,
  context: AssistantContext
): string {
  const base = intent ? intent.handler(context) : answerHelp();
  const withDisclaimer = intent?.isHealthIntent
    ? `${base} ${DISCLAIMER}`
    : base;
  return context.isDemoData
    ? `${withDisclaimer} ${DEMO_SUFFIX}`
    : withDisclaimer;
}

/**
 * Fully offline, rule-based intent matcher — no network call, no LLM key.
 * Answers are composed entirely from the caller-supplied `AssistantContext`.
 */
export const localGuide: AssistantClient = {
  ask: async (
    question: string,
    context: AssistantContext
  ): Promise<AssistantReply> => ({
    text: composeReply(matchIntent(question), context),
  }),
};

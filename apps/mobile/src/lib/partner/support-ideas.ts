import type { CycleDietPhase } from '@/lib/diet';
import type { TxKeyPath } from '@/lib/i18n';

/**
 * Curated, reviewed ideas and kind messages for the partner, per phase.
 * One idea per day, rotating so the partner doesn't see the same tip twice
 * in a row; "Another idea" steps through the rest.
 */
export type SupportTopic = CycleDietPhase | 'pregnancy';

const IDEA_INDEXES = ['0', '1', '2', '3'] as const;
const MESSAGE_INDEXES = ['0', '1'] as const;
const MS_PER_DAY = 86_400_000;

function dayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY
  );
}

export function supportIdeaKey(
  topic: SupportTopic,
  date: Date,
  skip = 0
): TxKeyPath {
  const index = IDEA_INDEXES[(dayNumber(date) + skip) % IDEA_INDEXES.length];
  return `partner.ideas.${topic}.${index}`;
}

export function kindMessageKey(
  topic: SupportTopic,
  date: Date,
  skip = 0
): TxKeyPath {
  const index =
    MESSAGE_INDEXES[(dayNumber(date) + skip) % MESSAGE_INDEXES.length];
  return `partner.messages.${topic}.${index}`;
}

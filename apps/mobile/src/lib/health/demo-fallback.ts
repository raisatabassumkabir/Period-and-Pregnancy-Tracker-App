import type { PaginateQuery } from '@/api/types';

export interface DemoFallbackSource<T> {
  data: PaginateQuery<T> | undefined;
  isError: boolean;
}

export interface DemoFallbackResult<T> {
  rows: readonly T[];
  /** True only when the seed is standing in for a failed request. */
  isDemo: boolean;
}

/**
 * Substitutes seed rows only when the request failed — an empty success is the
 * user's real (empty) data and must render the normal empty state, and a
 * pending query stays pending so real data replaces the seed on retry.
 */
export function withDemoFallback<T>(
  source: DemoFallbackSource<T>,
  seed: readonly T[]
): DemoFallbackResult<T> {
  if (source.data) return { rows: source.data.results, isDemo: false };
  if (source.isError) return { rows: seed, isDemo: true };
  return { rows: [], isDemo: false };
}

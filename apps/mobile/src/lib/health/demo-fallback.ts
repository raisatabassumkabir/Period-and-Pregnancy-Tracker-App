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
 * Substitutes seed rows only when the request failed AND the session is a
 * pre-seeded demo account (`allowSeed`). A real or fresh account with a failed
 * request gets an empty list, so it sees the first-cycle prompt instead of
 * someone else's fake history. An empty success is the user's real (empty)
 * data, and a pending query stays pending so real data replaces the seed.
 */
export function withDemoFallback<T>(
  source: DemoFallbackSource<T>,
  seed: readonly T[],
  allowSeed: boolean
): DemoFallbackResult<T> {
  if (source.data) return { rows: source.data.results, isDemo: false };
  if (source.isError && allowSeed) return { rows: seed, isDemo: true };
  return { rows: [], isDemo: false };
}

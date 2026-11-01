import type { PaginateQuery } from '@/api/types';

import { withDemoFallback } from './demo-fallback';

const SEED = ['seed-row'] as const;
const SEEDED_DEMO_SESSION = true;
const REAL_SESSION = false;

const page = (results: string[]): PaginateQuery<string> => ({
  results,
  count: results.length,
  next: null,
  previous: null,
});

describe('withDemoFallback', () => {
  it('returns real rows when the request succeeded', () => {
    const result = withDemoFallback(
      { data: page(['real-row']), isError: false },
      SEED,
      SEEDED_DEMO_SESSION
    );
    expect(result).toEqual({ rows: ['real-row'], isDemo: false });
  });

  it('keeps an empty success empty — never fakes over real data', () => {
    const result = withDemoFallback(
      { data: page([]), isError: false },
      SEED,
      SEEDED_DEMO_SESSION
    );
    expect(result).toEqual({ rows: [], isDemo: false });
  });

  it('substitutes the seed on error for a pre-seeded demo session', () => {
    const result = withDemoFallback(
      { data: undefined, isError: true },
      SEED,
      SEEDED_DEMO_SESSION
    );
    expect(result).toEqual({ rows: SEED, isDemo: true });
  });

  it('never seeds a real or fresh account, even when the request fails', () => {
    const result = withDemoFallback(
      { data: undefined, isError: true },
      SEED,
      REAL_SESSION
    );
    expect(result).toEqual({ rows: [], isDemo: false });
  });

  it('stays empty while the request is still pending', () => {
    const result = withDemoFallback(
      { data: undefined, isError: false },
      SEED,
      SEEDED_DEMO_SESSION
    );
    expect(result).toEqual({ rows: [], isDemo: false });
  });
});

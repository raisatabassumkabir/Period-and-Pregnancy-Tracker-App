import type { PaginateQuery } from '@/api/types';

import { withDemoFallback } from './demo-fallback';

const SEED = ['seed-row'] as const;

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
      SEED
    );
    expect(result).toEqual({ rows: ['real-row'], isDemo: false });
  });

  it('keeps an empty success empty — never fakes over real data', () => {
    const result = withDemoFallback({ data: page([]), isError: false }, SEED);
    expect(result).toEqual({ rows: [], isDemo: false });
  });

  it('substitutes the seed only on error', () => {
    const result = withDemoFallback({ data: undefined, isError: true }, SEED);
    expect(result).toEqual({ rows: SEED, isDemo: true });
  });

  it('stays empty while the request is still pending', () => {
    const result = withDemoFallback({ data: undefined, isError: false }, SEED);
    expect(result).toEqual({ rows: [], isDemo: false });
  });
});

import { useCycles } from '@/api/cycles';
import type { CycleInsights } from '@/lib/health';
import {
  DEMO_CYCLES,
  deriveCycleInsights,
  useDemoSeedAllowed,
  withDemoFallback,
} from '@/lib/health';

/** The same prediction the Home ring shows; `null` before any cycle exists. */
export function useNextPeriod(): CycleInsights | null {
  const { data, isError } = useCycles();
  const allowSeed = useDemoSeedAllowed();
  const { rows } = withDemoFallback({ data, isError }, DEMO_CYCLES, allowSeed);
  return deriveCycleInsights(rows);
}

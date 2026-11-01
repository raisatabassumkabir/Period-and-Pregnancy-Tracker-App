import { useHealthStore } from '@/store/useHealthStore';

/**
 * Whether the user is tracking a pregnancy. Pregnancy-only features (kick
 * counter, trimester meal plans) gate on this; cycle users never see them.
 */
export function useIsPregnancyMode(): boolean {
  return useHealthStore((state) => state.mode) === 'pregnancy';
}

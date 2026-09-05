import { create } from 'zustand';

import type { UpgradeRequiredDetail } from '@/api/billing/types';

import { createSelectors } from '../utils';

interface UpgradeState {
  visible: boolean;
  detail: UpgradeRequiredDetail | null;
  show: (detail: UpgradeRequiredDetail) => void;
  hide: () => void;
}

const _useUpgrade = create<UpgradeState>((set) => ({
  visible: false,
  detail: null,
  show: (detail) => set({ visible: true, detail }),
  hide: () => set({ visible: false }),
}));

export const useUpgrade = createSelectors(_useUpgrade);

export const showUpgrade = (detail: UpgradeRequiredDetail) =>
  _useUpgrade.getState().show(detail);

export const hideUpgrade = () => _useUpgrade.getState().hide();

export const getUpgradeState = () => _useUpgrade.getState();

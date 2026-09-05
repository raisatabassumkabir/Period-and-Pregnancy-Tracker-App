import { useColorScheme } from 'nativewind';
import React from 'react';
import { create } from 'zustand';

import { getItem, setItem, STORAGE_KEYS } from '../storage';
import { createSelectors } from '../utils';
import type { PaletteId, PaletteTokens, ThemeMode } from './palettes';
import { DEFAULT_PALETTE_ID, getPaletteTokens, isPaletteId } from './palettes';

/**
 * The selected palette lives in a store rather than in local component state
 * (which is how `use-selected-theme` does it) because the root layout has to
 * re-render to re-apply the CSS variables — a hook-local `useState` in the
 * settings row would never reach it.
 */
interface PaletteState {
  paletteId: PaletteId;
  /** False until AsyncStorage has been read, so the root can hold the splash. */
  hydrated: boolean;
  set: (id: PaletteId) => void;
  hydrate: (id: PaletteId) => void;
}

const _usePaletteStore = create<PaletteState>((set) => ({
  paletteId: DEFAULT_PALETTE_ID,
  hydrated: false,
  set: (paletteId) => set({ paletteId }),
  hydrate: (paletteId) => set({ paletteId, hydrated: true }),
}));

export const usePaletteStore = createSelectors(_usePaletteStore);

/**
 * Read the stored palette into the store. Call once at module scope in the root
 * layout, alongside `loadSelectedTheme()`.
 *
 * Storage is async, so the first paint uses {@link DEFAULT_PALETTE_ID}. That is
 * fine — the splash is still up — but it does mean the value can change once
 * after mount.
 */
export const loadSelectedPalette = async (): Promise<void> => {
  const stored = await getItem<string>(STORAGE_KEYS.SELECTED_PALETTE);
  _usePaletteStore
    .getState()
    .hydrate(isPaletteId(stored) ? stored : DEFAULT_PALETTE_ID);
};

/**
 * Read and write the selected palette. Use this in the settings picker; to
 * *style* something, use the `canvas` / `surface` / `ink` / `accent` / `tone`
 * Tailwind classes instead — they already resolve through the active palette.
 */
export const useSelectedPalette = () => {
  const selectedPalette = usePaletteStore.use.paletteId();

  const setSelectedPalette = React.useCallback(async (id: PaletteId) => {
    // Set first so the UI turns over immediately; the write is a background
    // detail and a failed write must not leave the picker looking stuck.
    _usePaletteStore.getState().set(id);
    await setItem(STORAGE_KEYS.SELECTED_PALETTE, id);
  }, []);

  return { selectedPalette, setSelectedPalette } as const;
};

/** The active palette's tokens for the current light/dark mode. */
export const usePaletteTokens = (): PaletteTokens => {
  const paletteId = usePaletteStore.use.paletteId();
  const { colorScheme } = useColorScheme();
  const mode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';

  return React.useMemo(
    () => getPaletteTokens(paletteId, mode),
    [paletteId, mode]
  );
};

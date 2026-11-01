import { colorScheme } from 'nativewind';
import React from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { create } from 'zustand';

import { getItem, setItem } from '../storage';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';
/** Happy Women defaults to the polished pastel light aesthetic. */
const DEFAULT_THEME: ColorSchemeType = 'light';

function isColorSchemeType(value: unknown): value is ColorSchemeType {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * The user's choice lives in a store, not in nativewind's colour scheme: when
 * the native appearance is pinned (`userInterfaceStyle` in app.config), the OS
 * keeps reporting "light" and nativewind silently ignores a manual "dark". The
 * root layout and the palette read THIS store, so the toggle always applies.
 */
const useThemeStore = create<{ selected: ColorSchemeType }>(() => ({
  selected: DEFAULT_THEME,
}));

function applyTheme(theme: ColorSchemeType): void {
  useThemeStore.setState({ selected: theme });
  // Still informs nativewind so its own `dark:` handling agrees where it can.
  colorScheme.set(theme);
}

/**
 * Read and change the stored theme choice (Settings → Theme). To style by
 * theme, use the palette classes or {@link useIsDarkMode}, not this.
 */
export const useSelectedTheme = () => {
  const selectedTheme = useThemeStore((state) => state.selected);

  const setSelectedTheme = React.useCallback(async (t: ColorSchemeType) => {
    applyTheme(t);
    await setItem(SELECTED_THEME, t);
  }, []);

  return { selectedTheme, setSelectedTheme } as const;
};

/** True when the app should render dark: an explicit choice, or the OS's when "system". */
export function useIsDarkMode(): boolean {
  const selected = useThemeStore((state) => state.selected);
  const system = useSystemColorScheme();
  if (selected === 'system') return system === 'dark';
  return selected === 'dark';
}

/** Root-layout boot step: restore the stored choice before first paint. */
export const loadSelectedTheme = async () => {
  const stored = await getItem<string>(SELECTED_THEME);
  applyTheme(isColorSchemeType(stored) ? stored : DEFAULT_THEME);
};

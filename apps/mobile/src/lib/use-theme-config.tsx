import type { Theme } from '@react-navigation/native';
import {
  DarkTheme as _DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import React from 'react';

import { usePaletteColors } from './theme';

/**
 * React Navigation's own chrome (screen background, header, card) is styled
 * through this theme object rather than through Tailwind, so it has to be fed
 * the active palette explicitly — otherwise a palette swap leaves navigator
 * backgrounds on the old colours and screens flash the wrong ground during
 * transitions.
 */
export function useThemeConfig(): Theme {
  const { colorScheme } = useColorScheme();
  const palette = usePaletteColors();
  const isDark = colorScheme === 'dark';

  return React.useMemo(() => {
    const base = isDark ? _DarkTheme : DefaultTheme;

    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: palette.accent,
        background: palette.canvas,
        card: palette.surface,
        text: palette.ink,
        border: palette.divider,
        notification: palette.accent,
      },
    };
  }, [isDark, palette]);
}

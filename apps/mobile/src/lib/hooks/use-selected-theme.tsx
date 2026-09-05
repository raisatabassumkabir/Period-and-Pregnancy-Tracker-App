import { colorScheme, useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';

import { getItem, setItem } from '../storage';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';
/**
 * this hooks should only be used while selecting the theme
 * This hooks will return the selected theme which is stored in AsyncStorage
 * selectedTheme should be one of the following values 'light', 'dark' or 'system'
 * don't use this hooks if you want to use it to style your component based on the theme use useColorScheme from nativewind instead
 *
 */
export const useSelectedTheme = () => {
  const { colorScheme: _color, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ColorSchemeType | null>(null);

  useEffect(() => {
    getItem<string>(SELECTED_THEME).then((storedTheme) => {
      const themeValue = (storedTheme ?? 'system') as ColorSchemeType;
      setThemeState(themeValue);
    });
  }, []);

  const setSelectedTheme = React.useCallback(
    async (t: ColorSchemeType) => {
      setColorScheme(t);
      await setItem(SELECTED_THEME, t);
      setThemeState(t);
    },
    [setColorScheme]
  );

  const selectedTheme = (theme ?? 'system') as ColorSchemeType;
  return { selectedTheme, setSelectedTheme } as const;
};
// to be used in the root file to load the selected theme from AsyncStorage
export const loadSelectedTheme = async () => {
  const theme = await getItem<string>(SELECTED_THEME);
  if (theme !== null) {
    colorScheme.set(theme as ColorSchemeType);
  }
};

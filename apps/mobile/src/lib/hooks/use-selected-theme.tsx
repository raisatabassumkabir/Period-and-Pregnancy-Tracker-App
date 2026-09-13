import { colorScheme, useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';

import { getItem, setItem } from '../storage';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';
/** Happy Women defaults to the polished pastel light aesthetic. */
const DEFAULT_THEME: ColorSchemeType = 'light';
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
      const themeValue = (storedTheme ?? DEFAULT_THEME) as ColorSchemeType;
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

  const selectedTheme = (theme ?? DEFAULT_THEME) as ColorSchemeType;
  return { selectedTheme, setSelectedTheme } as const;
};
// to be used in the root file to load the selected theme from storage
export const loadSelectedTheme = async () => {
  const theme = await getItem<string>(SELECTED_THEME);
  colorScheme.set((theme ?? DEFAULT_THEME) as ColorSchemeType);
};

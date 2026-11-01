import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { Platform } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

import { useIsDarkMode } from '@/lib/hooks/use-selected-theme';

type Props = { hidden?: boolean };
export const FocusAwareStatusBar = ({ hidden = false }: Props) => {
  const isFocused = useIsFocused();
  const isDark = useIsDarkMode();

  if (Platform.OS === 'web') return null;

  return isFocused ? (
    <SystemBars style={isDark ? 'light' : 'dark'} hidden={hidden} />
  ) : null;
};

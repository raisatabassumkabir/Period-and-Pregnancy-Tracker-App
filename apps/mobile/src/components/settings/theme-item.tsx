import { Moon, Palette, SmartphoneIcon, Sun } from 'lucide-react-native';
import React from 'react';

import type { OptionType } from '@/components/ui';
import { Options, useModal } from '@/components/ui';
import type { ColorSchemeType } from '@/lib';
import { translate, usePaletteColors, useSelectedTheme } from '@/lib';

import { Item } from './item';

const ICON_SIZE = 20;

export const ThemeItem = () => {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const colors = usePaletteColors();
  const modal = useModal();

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setSelectedTheme(option.value as ColorSchemeType);
      modal.dismiss();
    },
    [setSelectedTheme, modal]
  );

  const themes = React.useMemo(
    () => [
      {
        label: translate('settings.theme.light'),
        description: translate('settings.theme.light_hint'),
        value: 'light',
        icon: Sun,
      },
      {
        label: translate('settings.theme.dark'),
        description: translate('settings.theme.dark_hint'),
        value: 'dark',
        icon: Moon,
      },
      {
        label: translate('settings.theme.system'),
        description: translate('settings.theme.system_hint'),
        value: 'system',
        icon: SmartphoneIcon,
      },
    ],
    []
  );

  const theme = React.useMemo(
    () => themes.find((t) => t.value === selectedTheme),
    [selectedTheme, themes]
  );

  return (
    <>
      <Item
        text="settings.theme.title"
        value={theme?.label}
        icon={<Palette size={ICON_SIZE} color={colors.tone[600]} />}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={themes}
        onSelect={onSelect}
        value={theme?.value}
        title={translate('settings.theme.title')}
        testID="theme-options"
      />
    </>
  );
};

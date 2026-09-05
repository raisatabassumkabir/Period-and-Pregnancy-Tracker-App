import { Languages } from 'lucide-react-native';
import * as React from 'react';

import type { OptionType } from '@/components/ui';
import { Options, useModal } from '@/components/ui';
import { translate, usePaletteColors, useSelectedLanguage } from '@/lib';
import type { Language } from '@/lib/i18n/resources';

import { Item } from './item';

const ICON_SIZE = 20;

export const LanguageItem = () => {
  const { language, setLanguage } = useSelectedLanguage();
  const colors = usePaletteColors();
  const modal = useModal();
  const onSelect = React.useCallback(
    (option: OptionType) => {
      setLanguage(option.value as Language);
      modal.dismiss();
    },
    [setLanguage, modal]
  );

  const langs = React.useMemo(
    () => [
      { label: translate('settings.english'), value: 'en' },
      { label: translate('settings.arabic'), value: 'ar' },
    ],
    []
  );

  const selectedLanguage = React.useMemo(
    () => langs.find((lang) => lang.value === language),
    [language, langs]
  );

  return (
    <>
      <Item
        text="settings.language"
        value={selectedLanguage?.label}
        icon={<Languages size={ICON_SIZE} color={colors.tone[600]} />}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={langs}
        onSelect={onSelect}
        value={selectedLanguage?.value}
      />
    </>
  );
};

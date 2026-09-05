import { Env } from '@env';
import { LifeBuoy, Share2, Star } from 'lucide-react-native';
import React from 'react';

import { usePaletteColors } from '@/lib';
import {
  openPrivacyPolicy,
  openStoreListing,
  openSupportEmail,
  openTerms,
  shareApp,
} from '@/lib/external-links';

import { Item } from './item';
import { ItemsContainer } from './items-container';

const ICON_SIZE = 20;

export const SettingsLinks = () => {
  const iconColor = usePaletteColors().tone[600];

  return (
    <>
      <ItemsContainer title="settings.about">
        <Item text="settings.app_name" value={Env.NAME} />
        <Item text="settings.version" value={Env.VERSION} />
      </ItemsContainer>

      <ItemsContainer title="settings.support_us">
        <Item
          text="settings.share"
          icon={<Share2 size={ICON_SIZE} color={iconColor} />}
          onPress={() => void shareApp()}
        />
        <Item
          text="settings.rate"
          icon={<Star size={ICON_SIZE} color={iconColor} />}
          onPress={() => void openStoreListing()}
        />
        <Item
          text="settings.support"
          icon={<LifeBuoy size={ICON_SIZE} color={iconColor} />}
          onPress={() => void openSupportEmail()}
        />
      </ItemsContainer>

      <ItemsContainer title="settings.links">
        <Item
          text="settings.privacy"
          onPress={() => void openPrivacyPolicy()}
        />
        <Item text="settings.terms" onPress={() => void openTerms()} />
      </ItemsContainer>
    </>
  );
};

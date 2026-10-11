import { User } from 'lucide-react-native';
import React from 'react';

import { usePaletteColors } from '@/lib';
import { usePersonalizationProfile } from '@/lib/health/use-personalization-profile';

import { Item } from './item';
import { PersonalizationOptionsModal } from './personalization-modal';

const ICON_SIZE = 18;

export const PersonalizationItem = () => {
  const { profile } = usePersonalizationProfile();
  const palette = usePaletteColors();
  const [modalVisible, setModalVisible] = React.useState(false);

  const summaryText = `${profile.fullName || 'User'}, ${profile.age} yrs`;

  return (
    <>
      <Item
        testID="personalization-item"
        onPress={() => setModalVisible(true)}
        icon={<User size={ICON_SIZE} color={palette.accent} />}
        text="settings.profile_options"
        value={summaryText}
      />
      <PersonalizationOptionsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

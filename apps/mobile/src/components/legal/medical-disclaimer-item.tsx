import { ShieldAlert } from 'lucide-react-native';
import React from 'react';

import { Item } from '@/components/settings/item';
import { Modal, useModal, View } from '@/components/ui';
import { translate, usePaletteColors } from '@/lib';

import { MedicalDisclaimerContent } from './medical-disclaimer';

const ICON_SIZE = 20;
const SHEET_SNAP_POINTS = ['70%'];

/** Settings row that re-opens the disclaimer accepted on first run. */
export function MedicalDisclaimerItem() {
  const modal = useModal();
  const iconColor = usePaletteColors().tone[600];

  return (
    <>
      <Item
        text="settings.medical_disclaimer"
        icon={<ShieldAlert size={ICON_SIZE} color={iconColor} />}
        onPress={modal.present}
        testID="medical-disclaimer-item"
      />
      <Modal
        ref={modal.ref}
        snapPoints={SHEET_SNAP_POINTS}
        title={translate('medical_disclaimer.title')}
      >
        <View className="px-6 pb-8">
          <MedicalDisclaimerContent />
        </View>
      </Modal>
    </>
  );
}

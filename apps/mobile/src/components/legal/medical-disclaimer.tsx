import { ShieldAlert } from 'lucide-react-native';
import React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import type { TxKeyPath } from '@/lib';
import { translate, usePaletteColors } from '@/lib';
import { useMedicalDisclaimerAck } from '@/lib/hooks';

const ICON_SIZE = 28;

const PARAGRAPHS: readonly TxKeyPath[] = [
  'medical_disclaimer.intro',
  'medical_disclaimer.predictions',
  'medical_disclaimer.dating',
  'medical_disclaimer.care',
];

/** The disclaimer copy itself; shared by the first-run gate and Settings. */
export function MedicalDisclaimerContent() {
  return (
    <View className="gap-3">
      {PARAGRAPHS.map((key) => (
        <Text key={key} tx={key} className="text-[15px] leading-6 text-ink" />
      ))}
    </View>
  );
}

interface Props {
  children: React.ReactNode;
}

/**
 * Blocks the signed-in app until this install acknowledges the disclaimer.
 * Rendered in place of the tabs rather than as a sheet so it cannot be
 * swiped away unread.
 */
export function MedicalDisclaimerGate({ children }: Props) {
  const { acknowledged, acknowledge } = useMedicalDisclaimerAck();
  const palette = usePaletteColors();

  if (acknowledged === null) return null;
  if (acknowledged) return <>{children}</>;

  return (
    <View className="flex-1 bg-canvas" testID="medical-disclaimer-gate">
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="grow px-6 pb-6 pt-10">
          <View className="mb-5 size-14 items-center justify-center rounded-full bg-accent-100">
            <ShieldAlert size={ICON_SIZE} color={palette.accent} />
          </View>
          <Text
            tx="medical_disclaimer.title"
            className="mb-4 font-heading text-[26px] text-ink"
          />
          <MedicalDisclaimerContent />
        </ScrollView>
        <View className="px-6 pb-4">
          <Button
            label={translate('medical_disclaimer.accept')}
            size="lg"
            onPress={() => void acknowledge()}
            testID="medical-disclaimer-accept"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

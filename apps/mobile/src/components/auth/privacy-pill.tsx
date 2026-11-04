import { Lock } from 'lucide-react-native';
import React from 'react';

import { Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 14;

interface Props {
  label?: string;
}

/** A small, calm reassurance under the auth forms. */
export function PrivacyPill({
  label = 'Encrypted · never sold · delete anytime',
}: Props) {
  const palette = usePaletteColors();
  return (
    <View
      className="flex-row items-center gap-2 self-center rounded-pill bg-mint px-3.5 py-2"
      testID="privacy-pill"
    >
      <Lock size={ICON_SIZE} color={palette.ink} strokeWidth={2.4} />
      <Text className="font-body-bold text-[13px] text-mint-ink">{label}</Text>
    </View>
  );
}

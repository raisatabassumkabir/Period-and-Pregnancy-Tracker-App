import { CloudOff } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 22;

/**
 * Offline demo / clean-test accounts live only on this phone; the server has
 * never heard of them, so pairing can't work. Say so instead of failing silently.
 */
export function OfflineAccountCard() {
  const palette = usePaletteColors();
  return (
    <View className="rounded-card bg-surface p-5" testID="partner-offline-card">
      <View className="flex-row items-center gap-3">
        <View className="size-11 items-center justify-center rounded-full bg-accent-200">
          <CloudOff size={ICON_SIZE} color={palette.accent} />
        </View>
        <Text className="flex-1 font-heading text-[18px] text-ink">
          {translate('partner.offline.title')}
        </Text>
      </View>
      <Text className="mt-3 text-[14px] leading-5 text-tone-700">
        {translate('partner.offline.body')}
      </Text>
    </View>
  );
}

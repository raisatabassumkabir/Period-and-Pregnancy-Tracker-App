import { useRouter } from 'expo-router';
import { HeartHandshake } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 22;
const PARTNER_ROUTE = '/partner';

/** Home for a partner account that hasn't linked yet: one clear next step. */
export function NotLinkedCard() {
  const router = useRouter();
  const palette = usePaletteColors();
  return (
    <View className="rounded-card bg-surface p-5" testID="partner-not-linked">
      <View className="flex-row items-center gap-3">
        <View className="size-11 items-center justify-center rounded-full bg-accent-200">
          <HeartHandshake size={ICON_SIZE} color={palette.accent} />
        </View>
        <Text className="flex-1 font-heading text-[19px] text-ink">
          {translate('partner.home.not_linked')}
        </Text>
      </View>
      <Text className="mt-3 text-[14px] leading-5 text-tone-700">
        {translate('partner.home.not_linked_body')}
      </Text>
      <Button
        label={translate('partner.join.title')}
        onPress={() => router.push(PARTNER_ROUTE)}
        testID="partner-not-linked-cta"
        className="mt-4 rounded-pill"
      />
    </View>
  );
}

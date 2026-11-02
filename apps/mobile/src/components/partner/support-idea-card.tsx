import { Gift } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { Button, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import type { SupportTopic } from '@/lib/partner';
import { kindMessageKey, sendOnWhatsApp, supportIdeaKey } from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 20;

/** Today's small idea to support her, plus a ready-made kind message. */
export function SupportIdeaCard({ topic }: { topic: SupportTopic }) {
  const palette = usePaletteColors();
  const [skip, setSkip] = React.useState(0);
  const today = new Date();
  const message = translate(kindMessageKey(topic, today, skip));

  const send = () =>
    sendOnWhatsApp(message).catch(() =>
      showMessage({
        message: translate('partner.invite.share_failed'),
        type: 'warning',
      })
    );

  return (
    <View className="rounded-card bg-surface p-5" testID="partner-support-card">
      <View className="flex-row items-center gap-2">
        <Gift size={ICON_SIZE} color={palette.accent} />
        <Text className="font-body-bold text-[16px] text-ink">
          {translate('partner.home.today_idea')}
        </Text>
      </View>
      <Text
        className="mt-3 text-[16px] leading-6 text-ink"
        testID="partner-support-idea"
      >
        {translate(supportIdeaKey(topic, today, skip))}
      </Text>
      <View className="mt-3 rounded-panel bg-canvas p-3">
        <Text className="text-[13px] italic leading-5 text-tone-700">
          “{message}”
        </Text>
      </View>
      <Button
        label={translate('partner.home.send_kind_message')}
        onPress={send}
        testID="partner-send-message"
        className="mt-4 rounded-pill"
      />
      <Button
        variant="link"
        label={translate('partner.home.another_idea')}
        onPress={() => setSkip((value) => value + 1)}
        testID="partner-another-idea"
      />
    </View>
  );
}

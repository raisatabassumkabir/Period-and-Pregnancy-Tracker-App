import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import {
  CONTRACEPTION_SAFETY_DISCLAIMER,
  formatCalendarDate,
} from '@/lib/health';
import { translate } from '@/lib/i18n';
import type { PartnerView } from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 20;

/** Only rendered when she shares her fertile window. Estimates, clearly labelled. */
export function ConceiveCard({ view }: { view: PartnerView }) {
  const palette = usePaletteColors();
  if (!view.fertileStart || !view.fertileEnd) return null;
  const bestDays = view.bestDays
    .map((day) => formatCalendarDate(day))
    .join(', ');

  return (
    <View className="rounded-[28px] bg-mint p-5" testID="partner-conceive-card">
      <View className="flex-row items-center gap-2">
        <Sparkles size={ICON_SIZE} color={palette.ink} />
        <Text className="font-display text-[20px] text-ink">
          {translate('partner.ttc.title')}
        </Text>
      </View>
      <Text className="mt-3 text-[15px] text-ink">
        {translate('partner.ttc.window', {
          start: formatCalendarDate(view.fertileStart),
          end: formatCalendarDate(view.fertileEnd),
        })}
      </Text>
      <Text
        className="mt-1 font-body-bold text-[14px] text-mint-ink"
        testID="partner-best-days"
      >
        {translate('partner.ttc.best_days', { days: bestDays })}
      </Text>
      <Text className="mt-3 text-[13px] leading-5 text-mint-ink">
        {translate('partner.ttc.relax')}
      </Text>
      <Text className="mt-3 text-[12px] leading-5 text-mint-ink">
        {translate('partner.ttc.doctor')} {CONTRACEPTION_SAFETY_DISCLAIMER}
      </Text>
    </View>
  );
}

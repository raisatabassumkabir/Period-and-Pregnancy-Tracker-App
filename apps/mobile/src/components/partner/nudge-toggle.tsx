import React from 'react';
import { Switch, View } from 'react-native';

import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { usePartnerNudgeSettings } from '@/lib/partner';
import {
  areRemindersSupported,
  requestReminderPermission,
} from '@/lib/reminders';
import { usePaletteColors } from '@/lib/theme';

/** The partner's on/off for nudges; turning on asks the OS for permission first. */
export function NudgeToggle() {
  const palette = usePaletteColors();
  const enabled = usePartnerNudgeSettings((state) => state.settings.enabled);
  const update = usePartnerNudgeSettings((state) => state.update);
  if (!areRemindersSupported()) return null;

  const toggle = async (next: boolean) => {
    if (next && !(await requestReminderPermission())) return;
    update({ enabled: next });
  };

  return (
    <View
      className="flex-row items-center rounded-card bg-surface p-5"
      testID="partner-nudge-toggle"
    >
      <View className="flex-1 pr-4">
        <Text className="font-body-bold text-[16px] text-ink">
          {translate('partner.nudges.title')}
        </Text>
        <Text className="text-[13px] text-tone-600">
          {translate('partner.nudges.body')}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={toggle}
        trackColor={{ false: palette.tone[300], true: palette.accent }}
        thumbColor="#FFFFFF"
        accessibilityLabel={translate('partner.nudges.title')}
        testID="partner-nudge-switch"
      />
    </View>
  );
}

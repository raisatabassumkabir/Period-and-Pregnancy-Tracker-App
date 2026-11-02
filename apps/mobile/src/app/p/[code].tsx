import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator } from 'react-native';

import { View } from '@/components/ui';
import { isPartnerCode, savePendingPartnerCode } from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

/**
 * Target of partner invite links: https://<host>/p/<code> (Android App Link)
 * and happywomen://p/<code>. It only stores a VALID code; anything else in
 * the URL is ignored. The root layout then sends a signed-in user to the
 * Partner screen and a signed-out one through onboarding or login, where the
 * stored code is picked up.
 */
export default function InviteLink() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const palette = usePaletteColors();

  React.useEffect(() => {
    if (!isPartnerCode(code)) return;
    savePendingPartnerCode(code).catch(() => {
      // Storage unavailable: the partner can still type the code by hand.
    });
  }, [code]);

  return (
    <View
      className="flex-1 items-center justify-center bg-canvas"
      testID="invite-link-screen"
    >
      <ActivityIndicator color={palette.accent} />
    </View>
  );
}

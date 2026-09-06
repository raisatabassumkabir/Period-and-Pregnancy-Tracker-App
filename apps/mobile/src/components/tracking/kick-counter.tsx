import { Footprints } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';
import { useKickCounter } from '@/lib/tracking';

const KICK_ICON_SIZE = 26;

/** Tap-to-count fetal movements. Stored on-device, one bucket per day. */
export function KickCounter() {
  const { count, increment, reset } = useKickCounter();
  const palette = usePaletteColors();

  return (
    <View className="rounded-card bg-surface p-5" testID="kick-counter">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-heading text-[18px] text-ink">
            Kick counter
          </Text>
          <Text className="mt-1 text-[13px] text-tone-600">
            Movements felt today
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset today's kick count"
          testID="kick-reset"
          onPress={reset}
          className="rounded-full bg-tone-200 px-3 py-1.5"
        >
          <Text className="font-body-semibold text-[13px] text-ink">Reset</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Record a kick"
        testID="kick-increment"
        onPress={increment}
        className="mt-4 h-[120px] items-center justify-center rounded-card bg-accent-200"
      >
        <Footprints size={KICK_ICON_SIZE} color={palette.accentScale[800]} />
        <Text
          className="mt-1 font-heading text-[44px] leading-[52px] text-accent-900"
          testID="kick-count"
        >
          {count}
        </Text>
      </Pressable>
    </View>
  );
}

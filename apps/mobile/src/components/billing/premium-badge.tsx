import { Crown } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE_COMPACT = 12;
const ICON_SIZE = 14;

interface Props {
  testID?: string;
  compact?: boolean;
}

export const PremiumBadge = ({ testID = 'premium-badge', compact }: Props) => {
  const colors = usePaletteColors();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [shimmer]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.7 + shimmer.value * 0.3,
  }));

  return (
    <Animated.View
      style={style}
      testID={testID}
      className={`flex-row items-center self-start rounded-full bg-accent-200 ${
        compact ? 'px-2 py-0.5' : 'px-3 py-1'
      }`}
    >
      <Crown
        size={compact ? ICON_SIZE_COMPACT : ICON_SIZE}
        color={colors.accentScale[800]}
      />
      <View className="w-1" />
      <Text
        className={`font-body-bold text-accent-800 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        Premium
      </Text>
    </Animated.View>
  );
};

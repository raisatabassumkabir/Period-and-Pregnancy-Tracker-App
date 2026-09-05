import { Crown } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

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
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.0],
  });

  return (
    <Animated.View
      style={{ opacity }}
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
        PRO
      </Text>
    </Animated.View>
  );
};

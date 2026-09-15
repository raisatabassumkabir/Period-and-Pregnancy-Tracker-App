import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DOT_SIZE = 7;
const BOUNCE_HEIGHT = -6;
const ANIMATION_DURATION = 350;

function BouncingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(BOUNCE_HEIGHT, { duration: ANIMATION_DURATION }),
          withTiming(0, { duration: ANIMATION_DURATION })
        ),
        -1,
        true
      )
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: '#9A8E89',
        },
        animatedStyle,
      ]}
    />
  );
}

export function TypingIndicator() {
  return (
    <View
      testID="assistant-typing-indicator"
      className="mb-2 max-w-[85%] self-start rounded-2xl px-4 py-3"
      style={{
        backgroundColor: '#F3EFEA',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <BouncingDot delay={0} />
      <BouncingDot delay={180} />
      <BouncingDot delay={360} />
    </View>
  );
}

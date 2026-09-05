import React, { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = ViewProps & {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  useSpring?: boolean;
};

export function FadeInView({
  children,
  delay = 0,
  duration = 600,
  useSpring: shouldUseSpring = false,
  ...props
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldUseSpring) {
        opacity.value = withSpring(1);
        translateY.value = withSpring(0);
      } else {
        opacity.value = withTiming(1, { duration });
        translateY.value = withTiming(0, { duration });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity, translateY, shouldUseSpring]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle} {...props}>
      {children}
    </Animated.View>
  );
}

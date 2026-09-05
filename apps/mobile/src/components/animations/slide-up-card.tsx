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
  distance?: number;
};

export function SlideUpCard({
  children,
  delay = 0,
  duration = 500,
  distance = 50,
  ...props
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: duration * 0.8 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, distance, opacity, translateY]);

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

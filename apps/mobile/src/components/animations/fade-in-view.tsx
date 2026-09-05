import React, { useEffect, useRef } from 'react';
import { type ViewProps, Animated, Easing } from 'react-native';

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
  style,
  ...props
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldUseSpring) {
        Animated.parallel([
          Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity, translateY, shouldUseSpring]);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

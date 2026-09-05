import React, { useEffect, useRef } from 'react';
import { type ViewProps, Animated, Easing } from 'react-native';

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
  style,
  ...props
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration * 0.8,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, distance, opacity, translateY]);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

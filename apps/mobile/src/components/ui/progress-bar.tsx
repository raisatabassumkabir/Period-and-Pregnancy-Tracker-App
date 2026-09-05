import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { usePaletteColors } from '@/lib/theme';

type Props = {
  initialProgress?: number;
  className?: string;
  /** Overrides the palette accent. Use only when the bar sits on the accent itself. */
  fillColor?: string;
};

export type ProgressBarRef = {
  setProgress: (value: number) => void;
};

export const ProgressBar = forwardRef<ProgressBarRef, Props>(
  ({ initialProgress = 0, className = '', fillColor }, ref) => {
    const palette = usePaletteColors();
    const fill = fillColor ?? palette.accent;
    const progress = useRef(new Animated.Value(initialProgress ?? 0)).current;

    useImperativeHandle(ref, () => {
      return {
        setProgress: (value: number) => {
          Animated.timing(progress, {
            toValue: value,
            duration: 250,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }).start();
        },
      };
    }, [progress]);

    const width = progress.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View className={twMerge(`bg-tone-300`, className)}>
        <Animated.View style={{ width, backgroundColor: fill, height: 2 }} />
      </View>
    );
  }
);

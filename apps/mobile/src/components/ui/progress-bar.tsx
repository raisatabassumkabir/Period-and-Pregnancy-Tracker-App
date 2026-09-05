import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
    const progress = useSharedValue<number>(initialProgress ?? 0);
    useImperativeHandle(ref, () => {
      return {
        setProgress: (value: number) => {
          progress.value = withTiming(value, {
            duration: 250,
            easing: Easing.inOut(Easing.quad),
          });
        },
      };
    }, [progress]);

    const style = useAnimatedStyle(() => {
      return {
        width: `${progress.value}%`,
        backgroundColor: fill,
        height: 2,
      };
    });
    return (
      <View className={twMerge(`bg-tone-300`, className)}>
        <Animated.View style={style} />
      </View>
    );
  }
);

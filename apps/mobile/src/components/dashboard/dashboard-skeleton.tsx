import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const PULSE_MIN_OPACITY = 0.4;
const PULSE_MAX_OPACITY = 0.85;
const PULSE_STEP_MS = 800;

/** One shared breathing pulse, so every placeholder fades in step. */
function usePulseStyle() {
  const opacity = useSharedValue(PULSE_MIN_OPACITY);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(PULSE_MAX_OPACITY, { duration: PULSE_STEP_MS }),
        withTiming(PULSE_MIN_OPACITY, { duration: PULSE_STEP_MS })
      ),
      -1,
      true
    );
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function StatusCardPlaceholder() {
  return (
    <View className="h-[105px] flex-1 rounded-panel bg-surface p-4">
      <View className="mb-3 h-3.5 w-3/5 rounded-pill bg-tone-200" />
      <View className="mb-2 h-[22px] w-4/5 rounded-pill bg-tone-300" />
      <View className="h-3 w-2/5 rounded-pill bg-tone-200" />
    </View>
  );
}

/** Theme-aware loading shape of the dashboard: week strip, ring, action, tiles. */
export function DashboardSkeleton() {
  const pulseStyle = usePulseStyle();

  return (
    <View testID="dashboard-skeleton" className="w-full">
      {/* The real week strip stays on screen above, so no placeholder for it. */}
      <View className="my-6 items-center justify-center">
        <Animated.View
          className="size-60 items-center justify-center rounded-pill border-[16px] border-tone-200"
          style={pulseStyle}
        >
          <View className="mb-2.5 h-8 w-[90px] rounded-pill bg-tone-300" />
          <View className="h-4 w-[120px] rounded-pill bg-tone-300" />
        </Animated.View>
      </View>

      <View className="mb-5 items-center">
        <Animated.View
          className="h-12 w-[180px] rounded-pill bg-tone-200"
          style={pulseStyle}
        />
      </View>

      <Animated.View className="mt-2 flex-row gap-3" style={pulseStyle}>
        <StatusCardPlaceholder />
        <StatusCardPlaceholder />
      </Animated.View>
    </View>
  );
}

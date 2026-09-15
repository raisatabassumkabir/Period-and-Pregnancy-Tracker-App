import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const RING_SIZE = 240;
const STROKE_WIDTH = 16;

export function DashboardSkeleton() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View testID="dashboard-skeleton" className="w-full">
      {/* Week strip placeholder */}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 4,
          },
          animatedStyle,
        ]}
      >
        {Array.from({ length: 7 }).map((_, index) => (
          <View
            key={`skeleton-day-${index}`}
            style={{
              width: 44,
              height: 58,
              borderRadius: 22,
              backgroundColor: '#F3EAE6',
            }}
          />
        ))}
      </Animated.View>

      {/* Progress ring placeholder */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: 24,
        }}
      >
        <Animated.View
          style={[
            {
              width: RING_SIZE,
              height: RING_SIZE,
              borderRadius: RING_SIZE / 2,
              borderWidth: STROKE_WIDTH,
              borderColor: '#F3EAE6',
              alignItems: 'center',
              justifyContent: 'center',
            },
            animatedStyle,
          ]}
        >
          {/* Inner content placeholder */}
          <View
            style={{
              width: 90,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#EAE1DC',
              marginBottom: 10,
            }}
          />
          <View
            style={{
              width: 120,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#EAE1DC',
            }}
          />
        </Animated.View>
      </View>

      {/* Action button placeholder */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Animated.View
          style={[
            {
              width: 180,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#F3EAE6',
            },
            animatedStyle,
          ]}
        />
      </View>

      {/* Status cards placeholder */}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            gap: 12,
            marginTop: 8,
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            flex: 1,
            height: 105,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            padding: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: '60%',
              height: 14,
              borderRadius: 7,
              backgroundColor: '#F3EAE6',
              marginBottom: 12,
            }}
          />
          <View
            style={{
              width: '80%',
              height: 22,
              borderRadius: 11,
              backgroundColor: '#EAE1DC',
              marginBottom: 8,
            }}
          />
          <View
            style={{
              width: '40%',
              height: 12,
              borderRadius: 6,
              backgroundColor: '#F3EAE6',
            }}
          />
        </View>

        <View
          style={{
            flex: 1,
            height: 105,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            padding: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: '60%',
              height: 14,
              borderRadius: 7,
              backgroundColor: '#F3EAE6',
              marginBottom: 12,
            }}
          />
          <View
            style={{
              width: '75%',
              height: 22,
              borderRadius: 11,
              backgroundColor: '#EAE1DC',
              marginBottom: 8,
            }}
          />
          <View
            style={{
              width: '45%',
              height: 12,
              borderRadius: 6,
              backgroundColor: '#F3EAE6',
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

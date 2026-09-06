import {
  Baby,
  CalendarHeart,
  type LucideIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

interface Feature {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
}

export const FEATURES: readonly Feature[] = [
  {
    id: 'cycle',
    title: 'Track your cycle',
    body: 'Log periods and symptoms in seconds and see fertile and ovulation windows ahead.',
    icon: CalendarHeart,
  },
  {
    id: 'pregnancy',
    title: 'Pregnancy insights',
    body: 'Follow every week to your due date, with the trimester and what to expect.',
    icon: Baby,
  },
  {
    id: 'private',
    title: '100% private & secure',
    body: 'Your data is encrypted on this device and only ever shared when you say so.',
    icon: ShieldCheck,
  },
  {
    id: 'daily',
    title: 'Smart daily logging',
    body: 'Mood, flow and symptoms in one tap, with a calendar that colours itself.',
    icon: Sparkles,
  },
];

const ICON_SIZE = 40;
const ICON_WELL_SIZE = 88;
const DOT_SIZE = 8;
const DOT_ACTIVE_WIDTH = 24;
/** How far a slide sits below its resting position while off-screen. */
const SLIDE_OFFSET_Y = 24;

interface SlideProps {
  feature: Feature;
  index: number;
  width: number;
  scrollX: Animated.SharedValue<number>;
}

/** One feature. Fades and rises as it scrolls into place. */
function Slide({ feature, index, width, scrollX }: SlideProps) {
  const palette = usePaletteColors();
  const Icon = feature.icon;
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      inputRange,
      [0.25, 1, 0.25],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollX.value,
          inputRange,
          [SLIDE_OFFSET_Y, 0, SLIDE_OFFSET_Y],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <View style={{ width }} className="items-center px-8">
      <Animated.View style={style} className="items-center">
        <View
          className="items-center justify-center rounded-full bg-accent-200"
          style={{ width: ICON_WELL_SIZE, height: ICON_WELL_SIZE }}
        >
          <Icon size={ICON_SIZE} color={palette.accent} strokeWidth={1.75} />
        </View>
        <Text
          className="mt-6 text-center font-heading text-[26px] text-ink"
          testID={`feature-slide-${feature.id}`}
        >
          {feature.title}
        </Text>
        <Text className="mt-3 max-w-[300px] text-center text-[15px] leading-6 text-tone-700">
          {feature.body}
        </Text>
      </Animated.View>
    </View>
  );
}

interface DotProps {
  index: number;
  width: number;
  scrollX: Animated.SharedValue<number>;
}

/** Pager dot that stretches into a pill while its slide is active. */
function Dot({ index, width, scrollX }: DotProps) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const style = useAnimatedStyle(() => ({
    width: interpolate(
      scrollX.value,
      inputRange,
      [DOT_SIZE, DOT_ACTIVE_WIDTH, DOT_SIZE],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Animated.View
      style={[style, { height: DOT_SIZE, borderRadius: DOT_SIZE / 2 }]}
      className="bg-accent"
    />
  );
}

/**
 * Swipeable feature showcase for the first launch. Paging is native
 * `ScrollView` snapping; the fade/rise on each slide and the pager dots are
 * driven from the scroll offset on the UI thread.
 */
export function FeatureCarousel() {
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  return (
    <View testID="feature-carousel">
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        accessibilityRole="adjustable"
        accessibilityLabel="App features"
      >
        {FEATURES.map((feature, index) => (
          <Slide
            key={feature.id}
            feature={feature}
            index={index}
            width={width}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

      <View className="mt-8 flex-row items-center justify-center gap-2">
        {FEATURES.map((feature, index) => (
          <Dot key={feature.id} index={index} width={width} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
}

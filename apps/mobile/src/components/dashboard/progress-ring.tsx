import React from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RING_SIZE = 240;
const STROKE_WIDTH = 16;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** SVG arcs start at 3 o'clock; rotate so progress begins at the top. */
const START_ANGLE_DEGREES = -90;
const SWEEP_DURATION_MS = 900;

/** A coloured arc drawn on the track, as fractions of the full circle. */
export interface RingSegment {
  /** 0–1, inclusive start. */
  start: number;
  /** 0–1, exclusive end. */
  end: number;
  color: string;
}

interface Props {
  /** 0–1. Clamped, so a stale server value cannot overshoot the circle. */
  progress: number;
  color: string;
  trackColor: string;
  /** Phase arcs drawn under the sweep (period, fertile, ovulation). */
  segments?: readonly RingSegment[];
  /** Centre content — number, label, glyph. */
  children?: React.ReactNode;
  testID?: string;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Circular progress ring shared by the cycle and pregnancy dashboards. The
 * sweep animates on the UI thread through `strokeDashoffset`; segments are
 * static arcs so the eye reads "where am I" against "what is coming".
 * Colours are literals because SVG stroke props do not accept `className`.
 */
export function ProgressRing({
  progress,
  color,
  trackColor,
  segments = [],
  children,
  testID,
}: Props) {
  const center = RING_SIZE / 2;
  const sweep = useSharedValue(0);

  React.useEffect(() => {
    sweep.value = withTiming(clamp01(progress), {
      duration: SWEEP_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, sweep]);

  const sweepProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - sweep.value),
  }));

  return (
    <View className="items-center" testID={testID}>
      <View style={{ width: RING_SIZE, height: RING_SIZE }}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <G rotation={START_ANGLE_DEGREES} origin={`${center}, ${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={RADIUS}
              stroke={trackColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {segments.map((segment) => {
              const length = clamp01(segment.end) - clamp01(segment.start);
              if (length <= 0) return null;
              return (
                <Circle
                  key={`${segment.start}-${segment.end}-${segment.color}`}
                  cx={center}
                  cy={center}
                  r={RADIUS}
                  stroke={segment.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="butt"
                  strokeDasharray={`${CIRCUMFERENCE * length} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-CIRCUMFERENCE * clamp01(segment.start)}
                  fill="none"
                  opacity={0.35}
                />
              );
            })}
            <AnimatedCircle
              cx={center}
              cy={center}
              r={RADIUS}
              stroke={color}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={sweepProps}
              fill="none"
            />
          </G>
        </Svg>
        {/*
          Four explicit sides rather than `inset-0`: Tailwind compiles that to
          the CSS `inset` shorthand, which React Native has no equivalent for,
          so css-interop drops it — the box then collapses to its content and
          pins to the top-left instead of filling the ring. `px-8` keeps a long
          caption inside the stroke rather than letting it run across it.
        */}
        <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center px-8">
          {children}
        </View>
      </View>
    </View>
  );
}

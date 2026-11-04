import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { usePaletteColors } from '@/lib/theme';

const SQUIGGLE_WIDTH = 120;
const SQUIGGLE_HEIGHT = 10;
const DEFAULT_SPARKLE = 24;

interface SquiggleProps {
  width?: number;
  color?: string;
}

/** Hand-drawn underline that sits under a title. Decorative only. */
export function Squiggle({ width = SQUIGGLE_WIDTH, color }: SquiggleProps) {
  const palette = usePaletteColors();
  return (
    <Svg
      width={width}
      height={SQUIGGLE_HEIGHT}
      viewBox={`0 0 ${SQUIGGLE_WIDTH} ${SQUIGGLE_HEIGHT}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M2 6c16-5 28 3 42-1s24-5 38-1 22 3 36-1"
        fill="none"
        stroke={color ?? palette.accentScale[400]}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface SparkleProps {
  size?: number;
  color?: string;
}

/** Small four-point sparkle for card corners. Decorative only. */
export function Sparkle({ size = DEFAULT_SPARKLE, color }: SparkleProps) {
  const palette = usePaletteColors();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z"
        stroke={color ?? palette.accent}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

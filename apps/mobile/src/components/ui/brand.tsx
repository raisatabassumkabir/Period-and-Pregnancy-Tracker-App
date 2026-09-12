import { Env } from '@env';
import * as React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path } from 'react-native-svg';

import { usePaletteColors } from '@/lib/theme';

import { Text } from './text';

const DEFAULT_MARK_SIZE = 64;

interface BrandMarkProps extends SvgProps {
  size?: number;
  /** Primary accent color (Coral/Pink). Defaults to palette accent. */
  color?: string;
  /** Secondary accent color (Lavender/Purple). Defaults to palette accent-2. */
  secondaryColor?: string;
}

/**
 * The Happy Women mark: an elegant, flowing tulip/lotus line-art logo —
 * matching the brand theme with Coral Pink and Soft Lavender Purple curves,
 * topped with a delicate seed sparkle.
 */
export function BrandMark({
  size = DEFAULT_MARK_SIZE,
  color,
  secondaryColor,
  ...props
}: BrandMarkProps) {
  const palette = usePaletteColors();
  const pink = color ?? palette.accent;
  const purple = secondaryColor ?? color ?? palette.accent2;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
      {/* Top central pointed arch petal */}
      <Path
        d="M 26 28 C 28 19 32 12 32 12 C 32 12 36 19 38 28"
        stroke={pink}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top inner seed dot & sparkle rays */}
      <Circle cx={32} cy={26} r={1.2} fill={pink} />
      <Path
        d="M 32 23 V 20.5 M 29.5 24 L 27.5 22 M 34.5 24 L 36.5 22"
        stroke={pink}
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      {/* Left flowing leaf / stem curve */}
      <Path
        d="M 15 41 C 18 42 22 47 28 54"
        stroke={pink}
        strokeWidth={2.8}
        strokeLinecap="round"
      />

      {/* Left main petal */}
      <Path
        d="M 29 51 C 21 43 18 28 23 21 C 27 17 33 22 34 32"
        stroke={pink}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right main petal and sweeping bottom loop */}
      <Path
        d="M 32 30 C 35 22 42 21 46 25 C 48 30 42 39 33 46 C 27 51 25 57 29 60 C 35 62 43 60 48 54 C 53 48 55 42 54 38"
        stroke={purple}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner sweeping pink accent inside bottom loop */}
      <Path
        d="M 32 52 C 37 54 42 53 45 49"
        stroke={pink}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface BrandLockupProps {
  markSize?: number;
  /** Hides the wordmark where the surrounding copy already names the app. */
  showWordmark?: boolean;
  testID?: string;
}

/** Mark over the app name — the header every auth screen opens with. */
export function BrandLockup({
  markSize = DEFAULT_MARK_SIZE,
  showWordmark = true,
  testID,
}: BrandLockupProps) {
  return (
    <View className="items-center" testID={testID}>
      <BrandMark size={markSize} />
      {showWordmark && (
        <Text className="mt-2 font-heading text-[26px] tracking-tight text-ink">
          {Env.NAME}
        </Text>
      )}
    </View>
  );
}

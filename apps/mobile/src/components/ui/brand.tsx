import { Env } from '@env';
import * as React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { usePaletteColors } from '@/lib/theme';

import { Text } from './text';

const DEFAULT_MARK_SIZE = 84;

interface BrandMarkProps {
  /** Rendered diameter in px. */
  size?: number;
}

/**
 * The Happy Women mark: a girl resting in a crescent moon, on a soft pink
 * disc, with a small sparkle. Drawn in the palette's rose and lilac so it
 * follows the theme (and dark mode) instead of a fixed bitmap.
 */
export function BrandMark({ size = DEFAULT_MARK_SIZE }: BrandMarkProps) {
  const palette = usePaletteColors();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityRole="image"
      accessibilityLabel="Happy Women logo"
    >
      <Circle cx={32} cy={32} r={31} fill={palette.accentScale[200]} />
      <Path
        d="M41 11a22 22 0 1 0 13 30A18 18 0 1 1 41 11z"
        fill={palette.accent}
      />
      <Circle cx={33} cy={27} r={5} fill={palette.accent2} />
      <Path
        d="M29.5 24.5c1-4 7-4.5 8.5-.5"
        fill="none"
        stroke={palette.accent2}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path d="M24 44c1.5-8 16-8 18 0z" fill={palette.accent2} />
      <Path
        d="M50 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"
        fill={palette.accentScale[400]}
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
      {showWordmark ? (
        <Text className="mt-2.5 font-display text-[20px] text-accent-700">
          {Env.NAME}
        </Text>
      ) : null}
    </View>
  );
}

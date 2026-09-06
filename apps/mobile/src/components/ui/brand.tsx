import { Env } from '@env';
import * as React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import Svg, { G, Path } from 'react-native-svg';

import { usePaletteColors } from '@/lib/theme';

import { Text } from './text';

const DEFAULT_MARK_SIZE = 64;

/** One petal, drawn upright from the shared base point; the others are rotations. */
const PETAL_PATH = 'M32 50C25 41.5 24 27.5 32 13C40 27.5 39 41.5 32 50Z';
const PETAL_BASE = '32, 50';
/** Degrees off vertical for the inner and outer petal pairs. */
const INNER_PETAL_ANGLE = 27;
const OUTER_PETAL_ANGLE = 54;
const OUTER_PETAL_OPACITY = 0.72;
/** Shallow leaf the flower sits on. */
const BASE_PATH = 'M15 51C22 59 42 59 49 51C42 56 22 56 15 51Z';

interface BrandMarkProps extends SvgProps {
  size?: number;
  /** Defaults to the palette accent so the mark follows the active theme. */
  color?: string;
}

/**
 * The Happy Women mark: a five-petal lotus — a wellness symbol with no
 * religious or medical connotations. Outer petals are lighter so the shape
 * reads as layered rather than as a flat silhouette.
 *
 * The launcher/splash raster is drawn from the same geometry by
 * `scripts/generate-brand-assets.cjs` — change one, re-run the other.
 */
export function BrandMark({
  size = DEFAULT_MARK_SIZE,
  color,
  ...props
}: BrandMarkProps) {
  const palette = usePaletteColors();
  const fill = color ?? palette.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
      <G opacity={OUTER_PETAL_OPACITY}>
        <Path
          d={PETAL_PATH}
          fill={fill}
          rotation={-OUTER_PETAL_ANGLE}
          origin={PETAL_BASE}
        />
        <Path
          d={PETAL_PATH}
          fill={fill}
          rotation={OUTER_PETAL_ANGLE}
          origin={PETAL_BASE}
        />
      </G>
      <Path
        d={PETAL_PATH}
        fill={fill}
        rotation={-INNER_PETAL_ANGLE}
        origin={PETAL_BASE}
      />
      <Path
        d={PETAL_PATH}
        fill={fill}
        rotation={INNER_PETAL_ANGLE}
        origin={PETAL_BASE}
      />
      <Path d={PETAL_PATH} fill={fill} />
      <Path d={BASE_PATH} fill={fill} opacity={OUTER_PETAL_OPACITY} />
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

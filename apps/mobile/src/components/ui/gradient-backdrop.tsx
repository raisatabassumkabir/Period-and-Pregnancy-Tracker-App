import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';

import { usePaletteColors } from '@/lib/theme';

/** Where the warm tint gives way to the plain ground. */
const GRADIENT_STOPS = [0, 0.45, 1] as const;
const GRADIENT_START = { x: 0.15, y: 0 };
const GRADIENT_END = { x: 0.85, y: 1 };

/**
 * Full-bleed backdrop for the auth and onboarding screens: a diagonal wash
 * from the accent's deepest tint into the canvas, so the dark theme reads as
 * a rich surface rather than flat black. The stops come from the palette
 * ramps, so it stays correct in light mode and under every palette.
 *
 * `LinearGradient` is a third-party root, which css-interop skips, so the
 * absolute-fill style is a literal — the sanctioned exception.
 */
export function GradientBackdrop() {
  const palette = usePaletteColors();

  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#FFF8F5', '#FFF5F2', '#FFEFEC']} // Matches the new warm peach palette
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      testID="gradient-backdrop"
    />
  );
}

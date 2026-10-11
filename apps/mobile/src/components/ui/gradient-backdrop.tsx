import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';

/**
 * Full-bleed backdrop for the auth and onboarding screens: a diagonal wash
 * from the accent's deepest tint into the canvas.
 */
export function GradientBackdrop() {
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

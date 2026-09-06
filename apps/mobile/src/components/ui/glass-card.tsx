import React from 'react';
import { View } from 'react-native';

interface Props {
  children: React.ReactNode;
  className?: string;
  testID?: string;
}

/**
 * Translucent panel that lets the gradient backdrop show through — the
 * "glass" form container on the auth screens. It is a tint plus a hairline
 * edge rather than a real blur: `expo-blur` renders poorly on Android and
 * costs a frame budget, and over a gradient the tint alone gives the depth.
 *
 * `white`/`black` are fixed colours, not palette roles, so the light and dark
 * treatments are explicit `dark:` variants. The border is constant, so this
 * never toggles a shadow class at runtime.
 */
export function GlassCard({ children, className = '', testID }: Props) {
  return (
    <View
      testID={testID}
      className={`rounded-card border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      {children}
    </View>
  );
}

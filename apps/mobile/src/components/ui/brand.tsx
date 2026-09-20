import { Env } from '@env';
import * as React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { Image } from 'expo-image';

import { Text } from './text';

const DEFAULT_MARK_SIZE = 64;

interface BrandMarkProps extends SvgProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
}

export function BrandMark({
  size = DEFAULT_MARK_SIZE,
  color,
  secondaryColor,
  ...props
}: BrandMarkProps) {
  return (
    <Image 
      source={require('../../../assets/icon.png')} 
      style={{ width: size * 1.5, height: size * 1.5, borderRadius: (size * 1.5) / 2 }} 
      contentFit="cover"
    />
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

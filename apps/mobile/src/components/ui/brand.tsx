import { Env } from '@env';
import * as React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { Image } from 'expo-image';
import { useFonts } from 'expo-font';

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
  const [fontsLoaded] = useFonts({
    AngelFace: require('../../../assets/fonts/AngelFace.otf'),
  });

  return (
    <View className="items-center" testID={testID}>
      <BrandMark size={markSize} />
      {showWordmark && fontsLoaded && (
        <Text 
          className="mt-2 font-script text-[42px] tracking-tight text-accent"
          style={{
            textShadowColor: '#FF9FA8', // Matches text-accent
            textShadowOffset: { width: 0.5, height: 0.5 },
            textShadowRadius: 1
          }}
        >
          {Env.NAME}
        </Text>
      )}
    </View>
  );
}

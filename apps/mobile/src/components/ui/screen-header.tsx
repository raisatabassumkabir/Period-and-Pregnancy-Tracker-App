import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { usePaletteColors } from '@/lib/theme';

import { Text } from './text';

const BACK_ICON_SIZE = 22;
const PRESS_OPACITY = 0.8;

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Trailing slot — an action button, a badge, an overflow menu. */
  right?: React.ReactNode;
}

/** Back arrow + display title, the header every pushed screen shares. */
export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const colors = usePaletteColors();

  return (
    <View className="flex-row items-center gap-3 py-1">
      {onBack !== undefined && (
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID="screen-header-back"
          activeOpacity={PRESS_OPACITY}
          onPress={onBack}
        >
          <ArrowLeft color={colors.ink} size={BACK_ICON_SIZE} />
        </TouchableOpacity>
      )}
      <Text
        className="flex-1 font-heading text-[22px] text-ink"
        numberOfLines={1}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}

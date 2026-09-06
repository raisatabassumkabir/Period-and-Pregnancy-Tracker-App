import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { ArrowLeft } from '@/components/ui/icons';
import { usePaletteColors } from '@/lib';

const PRESS_OPACITY = 0.7;

interface Props {
  onGoBack: () => void;
}

export function LoginHeader({ onGoBack }: Props) {
  const colors = usePaletteColors();

  return (
    <View className="flex-row items-center gap-2 px-4 py-3">
      <TouchableOpacity
        activeOpacity={PRESS_OPACITY}
        onPress={onGoBack}
        className="p-2"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft color={colors.ink} />
      </TouchableOpacity>
      <Text className="flex-1 font-heading text-[22px] text-ink">
        Login with password
      </Text>
    </View>
  );
}

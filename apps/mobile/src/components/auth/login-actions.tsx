import { Link } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';

const PRESS_OPACITY = 0.85;

interface Props {
  isSubmitting: boolean;
  onPress: () => void;
}

export function LoginActions({ isSubmitting, onPress }: Props) {
  return (
    <>
      <TouchableOpacity
        testID="login-button"
        accessibilityRole="button"
        activeOpacity={PRESS_OPACITY}
        onPress={onPress}
        disabled={isSubmitting}
        className={`w-full items-center rounded-card bg-accent px-6 py-4 ${
          isSubmitting ? 'opacity-60' : ''
        }`}
      >
        <Text className="font-body-bold text-[16px] text-accent-100">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Text>
      </TouchableOpacity>

      <View className="mt-6 flex-row items-center justify-center">
        <Text className="text-[15px] text-tone-700">
          Don&apos;t have an account?{' '}
        </Text>
        <Link href="/register" asChild>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={PRESS_OPACITY}
          >
            <Text className="font-body-bold text-[15px] text-accent-700">
              Register
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

import { Env } from '@env';
import { useRouter } from 'expo-router';
import React from 'react';

import {
  FocusAwareStatusBar,
  Kicker,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib';

type ButtonVariant = 'primary' | 'secondary' | 'link';

interface OnboardingButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  testID?: string;
}

const BUTTON_STYLES: Record<
  ButtonVariant,
  { container: string; label: string }
> = {
  primary: {
    container: 'mb-3 w-full items-center rounded-card bg-accent px-6 py-4',
    label: 'font-body-bold text-[17px] text-accent-100',
  },
  secondary: {
    container: 'mb-4 w-full items-center rounded-card bg-surface px-6 py-4',
    label: 'font-body-bold text-[17px] text-ink',
  },
  link: {
    container: 'items-center py-2',
    label: 'font-body-semibold text-[15px] text-accent-700',
  },
};

function OnboardingButton({
  label,
  onPress,
  variant = 'primary',
  testID,
}: OnboardingButtonProps) {
  const style = BUTTON_STYLES[variant];

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      className={`${style.container} active:opacity-80`}
    >
      <Text className={style.label}>{label}</Text>
    </Pressable>
  );
}

interface OnboardingActionsProps {
  onLogin: () => void;
  onGetStarted: () => void;
  onSkip: () => void;
}

function OnboardingActions({
  onLogin,
  onGetStarted,
  onSkip,
}: OnboardingActionsProps) {
  return (
    <View className="px-6 pb-6">
      <OnboardingButton
        label="Log in"
        onPress={onLogin}
        variant="primary"
        testID="onboarding-login"
      />
      <OnboardingButton
        label="Get started for free"
        onPress={onGetStarted}
        variant="secondary"
        testID="onboarding-register"
      />
      <OnboardingButton
        label="Skip for now"
        onPress={onSkip}
        variant="link"
        testID="onboarding-skip"
      />
    </View>
  );
}

/**
 * Pre-auth welcome. Not on the default path: the root layout sends a
 * signed-out user straight to `/login`. Route here from `useIsFirstTime`
 * if the app wants a welcome step.
 */
export default function Onboarding() {
  const [_, setIsFirstTime] = useIsFirstTime();
  const router = useRouter();

  const handleSkip = () => {
    setIsFirstTime(false);
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          <Kicker>Welcome</Kicker>
          <Text className="mt-3 text-center font-heading text-[44px] text-accent">
            {Env.NAME}
          </Text>
          <View className="mt-2 h-1.5 w-36 rounded-full bg-accent2-600" />
          <Text className="mt-5 max-w-[280px] text-center text-[16px] text-tone-700">
            One sentence about what this app does for the person holding it.
          </Text>
        </View>
        <OnboardingActions
          onLogin={() => router.push('/login')}
          onGetStarted={() => router.push('/register')}
          onSkip={handleSkip}
        />
      </SafeAreaView>
    </View>
  );
}

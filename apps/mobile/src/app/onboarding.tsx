import { useRouter } from 'expo-router';
import React from 'react';

import { FeatureCarousel, ModeStep } from '@/components/auth';
import {
  BrandLockup,
  FocusAwareStatusBar,
  GradientBackdrop,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib';
import { useTrackingMode } from '@/lib/health';

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
    container:
      'mb-3 h-14 w-full items-center justify-center rounded-pill bg-accent px-6',
    label: 'font-body-bold text-[17px] text-accent-100',
  },
  secondary: {
    container:
      'mb-4 h-14 w-full items-center justify-center rounded-pill border border-black/5 bg-white/60 px-6 dark:border-white/10 dark:bg-white/5',
    label: 'font-body-bold text-[17px] text-ink',
  },
  link: {
    container: 'items-center py-2',
    label: 'font-body-semibold text-[15px] text-accent-700',
  },
};

const LOCKUP_MARK_SIZE = 44;

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

type OnboardingStep = 'welcome' | 'mode';

/**
 * First-launch flow: feature carousel → mode choice → login/register. The root
 * layout routes signed-out first-timers here via `useIsFirstTime`; every exit
 * clears the flag so later launches go straight to `/login`.
 */
export default function Onboarding() {
  const [, setIsFirstTime] = useIsFirstTime();
  const [mode, setMode] = useTrackingMode();
  const [step, setStep] = React.useState<OnboardingStep>('welcome');
  const router = useRouter();

  const finish = async (destination: '/login' | '/register' | '/') => {
    await setIsFirstTime(false);
    router.replace(destination);
  };

  return (
    <View className="flex-1 bg-canvas" testID="onboarding-screen">
      <GradientBackdrop />
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <View className="items-center pt-4">
          <BrandLockup markSize={LOCKUP_MARK_SIZE} />
        </View>
        <View className="flex-1 justify-center">
          {step === 'welcome' ? <FeatureCarousel /> : null}
          {step === 'mode' ? (
            <ModeStep value={mode} onChange={setMode} />
          ) : null}
        </View>
        {step === 'welcome' ? (
          <View className="px-6 pb-6">
            <OnboardingButton
              label="Continue"
              onPress={() => setStep('mode')}
              variant="primary"
              testID="onboarding-continue"
            />
          </View>
        ) : (
          <OnboardingActions
            onLogin={() => finish('/login')}
            onGetStarted={() => finish('/register')}
            onSkip={() => finish('/')}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

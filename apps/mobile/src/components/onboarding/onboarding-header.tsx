import { ArrowLeft } from 'lucide-react-native';
import React from 'react';

import { Pressable, Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onSkip: () => void;
  /** Rose on her onboarding; lilac on the partner's welcome. */
  tone?: 'rose' | 'lilac';
  testID?: string;
}

export function OnboardingHeader({
  currentStep,
  totalSteps,
  onBack,
  onSkip,
  testID = 'onboarding-header',
  tone = 'rose',
}: OnboardingHeaderProps) {
  const palette = usePaletteColors();
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <View testID={testID} className="px-6 pb-2 pt-3">
      <View className="h-11 flex-row items-center justify-between">
        {currentStep > 1 && onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="onboarding-back"
            onPress={onBack}
            className="size-10 items-center justify-center rounded-full border border-divider bg-surface active:opacity-75"
          >
            <ArrowLeft size={18} color={palette.ink} />
          </Pressable>
        ) : (
          <View className="size-10" />
        )}

        <Text className="font-body-semibold text-[13px] text-tone-600">
          Step {currentStep} of {totalSteps}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip"
          testID="onboarding-skip"
          onPress={onSkip}
          hitSlop={{ top: 16, bottom: 16, left: 24, right: 24 }}
          className="rounded-full border border-divider bg-surface px-4 py-2 active:opacity-60"
        >
          <Text
            className={`font-body-bold text-[13px] ${tone === 'lilac' ? 'text-accent2-700' : 'text-accent'}`}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Soft rounded progress bar */}
      <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-tone-200">
        <View
          className={`h-full rounded-full ${tone === 'lilac' ? 'bg-accent2' : 'bg-accent'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </View>
    </View>
  );
}

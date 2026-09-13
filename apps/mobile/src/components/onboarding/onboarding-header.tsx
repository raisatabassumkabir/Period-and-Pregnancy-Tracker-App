import { ArrowLeft } from 'lucide-react-native';
import React from 'react';

import { Pressable, Text, View } from '@/components/ui';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onSkip: () => void;
  testID?: string;
}

export function OnboardingHeader({
  currentStep,
  totalSteps,
  onBack,
  onSkip,
  testID = 'onboarding-header',
}: OnboardingHeaderProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <View testID={testID} className="px-6 pt-3 pb-2">
      <View className="flex-row items-center justify-between h-11">
        {currentStep > 1 && onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="onboarding-back"
            onPress={onBack}
            className="size-10 items-center justify-center rounded-full bg-white border border-[#F0E5E1] active:opacity-75"
            style={{
              shadowColor: '#F0E5E1',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.6,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <ArrowLeft size={18} color="#4A4A4A" />
          </Pressable>
        ) : (
          <View className="size-10" />
        )}

        <Text className="font-body-semibold text-[13px] text-[#8C8C8C]">
          Step {currentStep} of {totalSteps}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip"
          testID="onboarding-skip"
          onPress={onSkip}
          className="px-3 py-1.5 rounded-full bg-white/70 border border-[#F0E5E1] active:opacity-75"
        >
          <Text className="font-body-bold text-[13px] text-[#FF9FA8]">
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Soft rounded progress bar */}
      <View className="mt-2 h-1.5 w-full rounded-full bg-[#F0E5E1] overflow-hidden">
        <View
          className="h-full rounded-full bg-[#FF9FA8]"
          style={{ width: `${progressPercent}%` }}
        />
      </View>
    </View>
  );
}

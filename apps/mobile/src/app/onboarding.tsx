import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import { useSaveProfile } from '@/api/users';
import {
  type AppIntent,
  OnboardingHeader,
  StepAcquisition,
  StepBodyMetrics,
  StepCycleBaseline,
  StepGoals,
  StepIntent,
  StepMedical,
} from '@/components/onboarding';
import { Button, FocusAwareStatusBar, SafeAreaView, View } from '@/components/ui';
import { useAuth, useIsFirstTime } from '@/lib';
import { usePersonalizationProfile } from '@/lib/health/use-personalization-profile';
import { useHealthStore } from '@/store/useHealthStore';

const TOTAL_STEPS = 6;
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_DURATION = 5;

export default function Onboarding() {
  const router = useRouter();
  const status = useAuth.use.status();
  const [, setIsFirstTime] = useIsFirstTime();
  const { updateProfile } = usePersonalizationProfile();
  const setHealthMode = useHealthStore((s) => s.setMode);
  const saveProfileMutation = useSaveProfile();

  // Flow navigation state
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form selections
  const [intent, setIntent] = useState<AppIntent | null>(null);
  const [partnerCode, setPartnerCode] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [cycleLength, setCycleLength] = useState<number>(DEFAULT_CYCLE_LENGTH);
  const [periodDuration, setPeriodDuration] = useState<number>(DEFAULT_PERIOD_DURATION);
  const [heightCm, setHeightCm] = useState<string>('165');
  const [weightKg, setWeightKg] = useState<string>('60');

  // Step 2 goal toggle
  const handleToggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // Step 3 condition toggle with mutual exclusion for None / Not Sure
  const handleToggleCondition = (id: string) => {
    if (id === 'none' || id === 'not_sure') {
      setSelectedConditions((prev) => (prev.includes(id) ? [] : [id]));
      return;
    }

    setSelectedConditions((prev) => {
      const withoutExclusive = prev.filter((c) => c !== 'none' && c !== 'not_sure');
      return withoutExclusive.includes(id)
        ? withoutExclusive.filter((c) => c !== id)
        : [...withoutExclusive, id];
    });
  };

  // Step completion validation (Next button is disabled until valid)
  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return intent !== null;
      case 2:
        return selectedGoals.length > 0;
      case 3:
        return selectedConditions.length > 0;
      case 4:
        return selectedSource.trim().length > 0;
      case 5:
        return cycleLength >= 15 && periodDuration >= 1;
      case 6:
        return heightCm.trim().length > 0 && weightKg.trim().length > 0;
      default:
        return false;
    }
  };

  // Persist all data and navigate to app
  const completeOnboarding = async () => {
    const isPregnancyGoal = selectedGoals.includes('track_pregnancy');
    const assignedMode = isPregnancyGoal ? 'pregnancy' : 'cycle_tracking';

    const parsedHeight = parseFloat(heightCm) || null;
    const parsedWeight = parseFloat(weightKg) || null;

    // 1. Persist to local storage
    await updateProfile(
      {
        hasCompletedOnboarding: true,
        appIntent: intent ?? 'myself',
        partnerCode,
        goals: selectedGoals,
        medicalConditions: selectedConditions as any,
        source: selectedSource,
        averageCycleLength: cycleLength,
        averagePeriodDuration: periodDuration,
        height: heightCm,
        weight: weightKg,
        mode: assignedMode,
      },
      { silent: true }
    );

    // 2. Post to Django backend Profile model
    try {
      await saveProfileMutation.mutateAsync({
        mode: assignedMode,
        goals: selectedGoals,
        medical_conditions: selectedConditions.filter(
          (c) => c !== 'none' && c !== 'not_sure'
        ) as any,
        source: selectedSource,
        average_cycle_length: cycleLength,
        average_period_duration: periodDuration,
        height: parsedHeight,
        weight: parsedWeight,
      });
    } catch (err) {
      console.warn('Profile sync to Django backend was skipped or errored:', err);
    }

    setHealthMode(isPregnancyGoal ? 'pregnancy' : 'cycle');
    await setIsFirstTime(false);

    if (status === 'signIn') {
      router.replace('/(app)');
    } else {
      router.replace('/login');
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  return (
    <View className="flex-1 bg-[#FCF8F5]" testID="onboarding-screen">
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header with Back, Step Progress, and Skip */}
        <OnboardingHeader
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handleBack}
          onSkip={handleSkip}
        />

        {/* Step Views */}
        <View className="flex-1">
          {currentStep === 1 && (
            <StepIntent
              intent={intent}
              partnerCode={partnerCode}
              onSelectIntent={setIntent}
              onChangePartnerCode={setPartnerCode}
            />
          )}

          {currentStep === 2 && (
            <StepGoals
              selectedGoals={selectedGoals}
              onToggleGoal={handleToggleGoal}
            />
          )}

          {currentStep === 3 && (
            <StepMedical
              selectedConditions={selectedConditions}
              onToggleCondition={handleToggleCondition}
            />
          )}

          {currentStep === 4 && (
            <StepAcquisition
              selectedSource={selectedSource}
              onSelectSource={setSelectedSource}
            />
          )}

          {currentStep === 5 && (
            <StepCycleBaseline
              cycleLength={cycleLength}
              periodDuration={periodDuration}
              onChangeCycleLength={setCycleLength}
              onChangePeriodDuration={setPeriodDuration}
            />
          )}

          {currentStep === 6 && (
            <StepBodyMetrics
              heightCm={heightCm}
              weightKg={weightKg}
              onChangeHeight={setHeightCm}
              onChangeWeight={setWeightKg}
            />
          )}
        </View>

        {/* Bottom Action Button */}
        <View className="px-6 pb-6 pt-2 bg-[#FCF8F5]">
          <Button
            label={currentStep === TOTAL_STEPS ? 'Complete & Start' : 'Next'}
            size="lg"
            className="h-14 rounded-pill"
            disabled={!isCurrentStepValid()}
            onPress={handleNext}
            testID="onboarding-next"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

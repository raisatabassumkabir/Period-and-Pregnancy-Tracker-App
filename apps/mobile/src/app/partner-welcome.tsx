import { useRouter } from 'expo-router';
import React from 'react';

import {
  NO_SYMPTOMS,
  OnboardingHeader,
  StepPartnerFertile,
  StepPartnerGoals,
  StepPartnerIntimacy,
  StepPartnerPaired,
  StepPartnerSetup,
  StepPartnerSymptoms,
  toggleChoice,
} from '@/components/onboarding';
import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  View,
} from '@/components/ui';
import { usePersonalizationProfile } from '@/lib/health';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { usePartnerSide } from '@/lib/partner';

const HOME_ROUTE = '/(app)';

const STEPS = [
  'paired',
  'goals',
  'symptoms',
  'fertile',
  'intimacy',
  'setup',
] as const;
type Step = (typeof STEPS)[number];

const BUTTON_LABELS: Record<Step, TxKeyPath> = {
  paired: 'common.continue',
  goals: 'partner.onboarding.next',
  symptoms: 'partner.onboarding.next',
  fertile: 'partner.onboarding.next',
  intimacy: 'partner.onboarding.next',
  setup: 'partner.onboarding.setup_done',
};

interface Answers {
  goals: string[];
  symptoms: string[];
  knewFertileDays: boolean | null;
  intimacy: string[];
}

const NO_ANSWERS: Answers = {
  goals: [],
  symptoms: [],
  knewFertileDays: null,
  intimacy: [],
};

/** Whether the step has what it needs before "Next" lights up. */
function canContinue(step: Step, answers: Answers, setupReady: boolean) {
  if (step === 'goals') return answers.goals.length > 0;
  if (step === 'symptoms') return answers.symptoms.length > 0;
  if (step === 'fertile') return answers.knewFertileDays !== null;
  if (step === 'setup') return setupReady;
  return true;
}

/** Saves his answers on this phone (never shared with her), then opens his home. */
function useFinishWelcome() {
  const router = useRouter();
  const { updateProfile } = usePersonalizationProfile();
  const [saving, setSaving] = React.useState(false);
  const finish = async (answers: Answers) => {
    setSaving(true);
    try {
      await updateProfile(
        {
          appIntent: 'partner',
          hasCompletedOnboarding: true,
          partnerGoals: answers.goals,
          partnerSymptoms: answers.symptoms,
          partnerKnewFertileDays: answers.knewFertileDays ?? undefined,
          partnerIntimacyGoals: answers.intimacy,
        },
        { silent: true }
      );
    } catch (error: unknown) {
      // The answers only tailor tips; never block the partner home on them.
      console.warn('Could not save partner answers:', error);
    } finally {
      setSaving(false);
      router.replace(HOME_ROUTE);
    }
  };
  return { finish, saving };
}

function StepBody(props: {
  step: Step;
  answers: Answers;
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
  herName: string;
  myName: string;
  onSetupReady: () => void;
}) {
  const { step, answers, setAnswers, herName, myName, onSetupReady } = props;
  const toggle =
    (key: 'goals' | 'symptoms' | 'intimacy', exclusive?: string) =>
    (id: string) =>
      setAnswers((current) => ({
        ...current,
        [key]: toggleChoice(current[key], id, exclusive),
      }));
  switch (step) {
    case 'paired':
      return <StepPartnerPaired herName={herName} myName={myName} />;
    case 'goals':
      return (
        <StepPartnerGoals
          selectedGoals={answers.goals}
          onToggleGoal={toggle('goals')}
        />
      );
    case 'symptoms':
      return (
        <StepPartnerSymptoms
          herName={herName}
          selected={answers.symptoms}
          onToggle={toggle('symptoms', NO_SYMPTOMS)}
        />
      );
    case 'fertile':
      return (
        <StepPartnerFertile
          knewFertileDays={answers.knewFertileDays}
          onAnswer={(knew) =>
            setAnswers((current) => ({ ...current, knewFertileDays: knew }))
          }
        />
      );
    case 'intimacy':
      return (
        <StepPartnerIntimacy
          selected={answers.intimacy}
          onToggle={toggle('intimacy')}
        />
      );
    case 'setup':
      return (
        <StepPartnerSetup
          herName={herName}
          myName={myName}
          onReady={onSetupReady}
        />
      );
  }
}

/**
 * Shown right after a partner code is redeemed: "you're paired with <her>",
 * then a few private questions, then a short setup moment before his home.
 */
export default function PartnerWelcome() {
  const { link } = usePartnerSide();
  const { profile } = usePersonalizationProfile();
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answers>(NO_ANSWERS);
  const [setupReady, setSetupReady] = React.useState(false);
  const onSetupReady = React.useCallback(() => setSetupReady(true), []);
  const { finish, saving } = useFinishWelcome();
  const step = STEPS[index];
  const herName =
    link?.other_name || translate('partner.home.her_name_fallback');
  const isLast = index === STEPS.length - 1;
  const advance = () => (isLast ? finish(answers) : setIndex(index + 1));

  return (
    <View className="flex-1 bg-accent2-100/50" testID="partner-welcome-screen">
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <OnboardingHeader
          currentStep={index + 1}
          totalSteps={STEPS.length}
          onBack={() => setIndex(Math.max(0, index - 1))}
          onSkip={advance}
          tone="lilac"
        />
        <View className="flex-1 px-6 pt-4">
          <StepBody
            step={step}
            answers={answers}
            setAnswers={setAnswers}
            herName={herName}
            myName={profile.fullName}
            onSetupReady={onSetupReady}
          />
        </View>
        <View className="px-6 pb-4 pt-2">
          <Button
            variant="partner"
            size="lg"
            label={translate(BUTTON_LABELS[step])}
            disabled={!canContinue(step, answers, setupReady)}
            loading={saving}
            onPress={advance}
            className="my-0 h-14 rounded-pill"
            testID="partner-welcome-next"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

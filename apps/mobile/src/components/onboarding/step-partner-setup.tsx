import { Check } from 'lucide-react-native';
import React from 'react';

import { Sparkle, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

const STEP_DELAY_MS = 650;
const CHECK_SIZE = 14;
const CHECK_STROKE = 3;

interface Props {
  herName: string;
  myName?: string;
  /** Called once every line is ticked, so the button can light up. */
  onReady: () => void;
}

/** Ticks one line at a time; a small, honest "we're getting ready" moment. */
function useTickedCount(total: number, onReady: () => void): number {
  const [ticked, setTicked] = React.useState(0);
  React.useEffect(() => {
    if (ticked >= total) {
      onReady();
      return;
    }
    const timer = setTimeout(
      () => setTicked((value) => value + 1),
      STEP_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [ticked, total, onReady]);
  return ticked;
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '♡';
}

function Line(props: { label: string; done: boolean; last: boolean }) {
  const { label, done, last } = props;
  return (
    <View className="flex-row items-start gap-3.5">
      <View className="items-center">
        <View
          className={`size-7 items-center justify-center rounded-full border-2 ${
            done ? 'border-accent2 bg-accent2' : 'border-accent2-300 bg-surface'
          }`}
        >
          {done ? (
            <Check size={CHECK_SIZE} color="white" strokeWidth={CHECK_STROKE} />
          ) : null}
        </View>
        {last ? null : (
          <View
            className={`h-6 w-0.5 ${done ? 'bg-accent2' : 'bg-accent2-200'}`}
          />
        )}
      </View>
      <Text
        className={`pt-0.5 font-body-bold text-[16px] ${done ? 'text-ink' : 'text-tone-600'}`}
      >
        {label}
      </Text>
    </View>
  );
}

/** "Thanks, Daniel! Getting things ready for you both." */
export function StepPartnerSetup({ herName, myName, onReady }: Props) {
  const lines = [
    translate('partner.onboarding.setup_cycle', { name: herName }),
    translate('partner.onboarding.setup_tips'),
    translate('partner.onboarding.setup_nudges'),
  ];
  const ticked = useTickedCount(lines.length, onReady);
  const firstName = myName?.trim().split(' ')[0];
  return (
    <View className="flex-1 pt-6" testID="step-partner-setup">
      <View className="h-[180px] w-[230px] self-center">
        <View className="absolute left-0 top-3 size-[140px] rounded-full bg-accent-100" />
        <View className="absolute right-0 top-8 size-[140px] rounded-full bg-accent2-100" />
        <View className="absolute left-10 top-14 size-[72px] items-center justify-center rounded-full border-4 border-surface bg-accent">
          <Text className="font-display text-[28px] text-white">
            {initialOf(herName)}
          </Text>
        </View>
        <View className="absolute right-10 top-20 size-[72px] items-center justify-center rounded-full border-4 border-surface bg-accent2">
          <Text className="font-display text-[28px] text-white">
            {initialOf(firstName || 'You')}
          </Text>
        </View>
        <View className="absolute left-[100px] top-0">
          <Sparkle size={28} />
        </View>
      </View>
      <Text className="mt-7 text-center font-display text-[28px] leading-[35px] text-ink">
        {firstName
          ? translate('partner.onboarding.setup_title', { name: firstName })
          : translate('partner.onboarding.setup_title_anonymous')}
      </Text>
      <View className="mt-7 rounded-[26px] border-2 border-accent2-200 bg-surface p-5">
        {lines.map((label, index) => (
          <Line
            key={label}
            label={label}
            done={index < ticked}
            last={index === lines.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

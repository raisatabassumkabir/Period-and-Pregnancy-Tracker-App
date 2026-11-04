import { Heart, Lock } from 'lucide-react-native';
import React from 'react';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Sparkle, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

const ENTRANCE_MS = 600;
const BIG_HEART = 44;
const SMALL_HEART = 20;
const LOCK_SIZE = 14;
const TILT_DEG = 4;

interface Props {
  /** Her name from the partner link, e.g. "Claire". */
  herName: string;
  /** The partner's own name; its initial goes on "You". */
  myName?: string;
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '♡';
}

function Avatar(props: { initial: string; label: string; isHer: boolean }) {
  const { initial, label, isHer } = props;
  return (
    <View
      className="items-center gap-2.5"
      style={{ transform: [{ rotate: `${isHer ? -TILT_DEG : TILT_DEG}deg` }] }}
    >
      <View
        className={`size-24 items-center justify-center rounded-full border-[5px] border-surface ${
          isHer ? 'bg-accent' : 'bg-accent2'
        }`}
      >
        <Text className="font-display text-[40px] leading-[48px] text-white">
          {initial}
        </Text>
      </View>
      <Text
        className={`font-body-bold text-[16px] ${isHer ? 'text-accent-700' : 'text-accent2-700'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function PairedIllustration({ herName, myName }: Props) {
  const palette = usePaletteColors();
  const you = translate('partner.onboarding.you_label');
  return (
    <Animated.View
      entering={FadeInDown.duration(ENTRANCE_MS)}
      className="h-[230px] w-full flex-row items-center justify-center gap-12 rounded-[40px] bg-accent-100"
    >
      <Avatar initial={initialOf(herName)} label={herName} isHer />
      <Avatar initial={initialOf(myName || you)} label={you} isHer={false} />
      <Animated.View
        entering={ZoomIn.delay(ENTRANCE_MS / 2).springify()}
        pointerEvents="none"
        className="absolute inset-x-0 top-7 items-center"
      >
        <Heart
          size={BIG_HEART}
          color={palette.accent}
          fill={palette.accentScale[300]}
        />
        <View className="mt-9">
          <Heart
            size={SMALL_HEART}
            color={palette.accent2Scale[400]}
            fill={palette.accent2Scale[300]}
          />
        </View>
      </Animated.View>
      <View className="absolute right-6 top-6">
        <Sparkle size={22} />
      </View>
    </Animated.View>
  );
}

/** "You and Claire are paired!": both of you, with a promise about privacy. */
export function StepPartnerPaired({ herName, myName }: Props) {
  const palette = usePaletteColors();
  return (
    <View
      className="flex-1 items-center justify-center"
      testID="step-partner-paired"
    >
      <PairedIllustration herName={herName} myName={myName} />
      <Animated.View
        entering={FadeInDown.delay(ENTRANCE_MS / 3).duration(ENTRANCE_MS)}
        className="mt-8 items-center"
      >
        <Text className="text-center font-display text-[30px] leading-[37px] text-ink">
          {translate('partner.onboarding.paired_title', { name: herName })}
        </Text>
        <Text className="mt-3 text-center text-[16px] leading-6 text-tone-600">
          {translate('partner.onboarding.paired_body')}
        </Text>
      </Animated.View>
      <View className="mt-6 flex-row items-center gap-2 rounded-pill border-[1.5px] border-accent2-200 bg-surface px-3.5 py-2">
        <Lock
          size={LOCK_SIZE}
          color={palette.accent2Scale[700]}
          strokeWidth={2.4}
        />
        <Text className="font-body-bold text-[13px] text-accent2-700">
          {translate('partner.onboarding.paired_privacy')}
        </Text>
      </View>
    </View>
  );
}

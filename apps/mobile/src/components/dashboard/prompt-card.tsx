import type { LucideIcon } from 'lucide-react-native';
import { ArrowRight } from 'lucide-react-native';
import React from 'react';

import { Pressable, Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

const BUBBLE_ICON_SIZE = 22;
const CTA_ICON_SIZE = 16;

/**
 * `accent` for cycle actions, `accent2` for pregnancy ones. Every colour is a
 * palette token, so the card follows all six palettes in light and dark.
 * The tone is fixed per instance: nothing here toggles at runtime.
 */
export type PromptTone = 'accent' | 'accent2';

const TONE_CLASSES: Record<
  PromptTone,
  { card: string; bubble: string; cta: string; ctaLabel: string }
> = {
  accent: {
    card: 'border-accent-200 bg-surface',
    bubble: 'bg-accent-200',
    cta: 'bg-accent',
    ctaLabel: 'text-white',
  },
  // Same surface as every other card: the secondary hue marks only the bubble
  // and button, so it accents the screen instead of tinting a whole block.
  accent2: {
    card: 'border-divider bg-surface',
    bubble: 'bg-accent2-200',
    cta: 'bg-accent2-600',
    ctaLabel: 'text-white',
  },
};

export interface PromptCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  body?: string;
  tone?: PromptTone;
  cta?: { label: string; onPress: () => void; testID?: string };
  testID?: string;
}

function useToneColors(tone: PromptTone) {
  const palette = usePaletteColors();
  return tone === 'accent'
    ? { icon: palette.accent, ctaIcon: '#FFFFFF' }
    : { icon: palette.accent2Scale[700], ctaIcon: '#FFFFFF' };
}

/** Icon + title + optional body + one call to action, in a soft themed card. */
export function PromptCard(props: PromptCardProps) {
  const { icon: Icon, title, subtitle, body, cta, testID } = props;
  const tone = props.tone ?? 'accent';
  const classes = TONE_CLASSES[tone];
  const colors = useToneColors(tone);

  return (
    <View className={`rounded-card border p-5 ${classes.card}`} testID={testID}>
      <View className="flex-row items-center gap-3.5">
        <View
          className={`size-12 items-center justify-center rounded-full ${classes.bubble}`}
        >
          <Icon size={BUBBLE_ICON_SIZE} color={colors.icon} strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-[16px] leading-5 text-ink">
            {title}
          </Text>
          <Text className="mt-0.5 text-[13px] leading-[18px] text-tone-600">
            {subtitle}
          </Text>
        </View>
      </View>

      {body ? (
        <Text className="mt-3.5 text-[14px] leading-5 text-tone-700">
          {body}
        </Text>
      ) : null}

      {cta ? (
        <Pressable
          accessibilityRole="button"
          testID={cta.testID}
          onPress={cta.onPress}
          className={`mt-4 h-12 flex-row items-center justify-center gap-2 rounded-pill px-5 active:opacity-90 ${classes.cta}`}
        >
          <Text className={`font-body-bold text-[15px] ${classes.ctaLabel}`}>
            {cta.label}
          </Text>
          <ArrowRight
            size={CTA_ICON_SIZE}
            color={colors.ctaIcon}
            strokeWidth={2.5}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

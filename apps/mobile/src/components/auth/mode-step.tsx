import { Baby, CalendarHeart } from 'lucide-react-native';
import React from 'react';

import { Kicker, Pressable, Text, View } from '@/components/ui';
import type { TrackingMode } from '@/lib/health';
import { usePaletteColors } from '@/lib/theme';

const MODE_ICON_SIZE = 26;

interface ModeOption {
  mode: TrackingMode;
  title: string;
  description: string;
  icon: typeof CalendarHeart;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  {
    mode: 'cycle_tracking',
    title: 'Cycle tracking',
    description: 'Follow your period, symptoms and predictions day by day.',
    icon: CalendarHeart,
  },
  {
    mode: 'pregnancy',
    title: 'Pregnancy',
    description: 'Follow your week-by-week timeline through to your due date.',
    icon: Baby,
  },
];

interface ModeCardProps {
  option: ModeOption;
  selected: boolean;
  onSelect: (mode: TrackingMode) => void;
}

function ModeCard({ option, selected, onSelect }: ModeCardProps) {
  const palette = usePaletteColors();
  const Icon = option.icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={`mode-${option.mode}`}
      onPress={() => onSelect(option.mode)}
      // Colour-only selection toggle; never a runtime-toggled shadow class.
      className={`mb-3 w-full flex-row items-center gap-4 rounded-card border-2 p-5 ${
        selected ? 'border-accent bg-accent-200' : 'border-divider bg-surface'
      }`}
    >
      <Icon
        size={MODE_ICON_SIZE}
        color={selected ? palette.accent : palette.tone[600]}
      />
      <View className="flex-1">
        <Text className="font-body-bold text-[17px] text-ink">
          {option.title}
        </Text>
        <Text className="mt-1 text-[13px] leading-5 text-tone-700">
          {option.description}
        </Text>
      </View>
    </Pressable>
  );
}

interface ModeStepProps {
  value: TrackingMode;
  onChange: (mode: TrackingMode) => void;
}

/** Onboarding step: which half of the app should lead. Persisted on-device. */
export function ModeStep({ value, onChange }: ModeStepProps) {
  return (
    <View className="w-full items-center px-6">
      <Kicker>Personalise</Kicker>
      <Text className="mt-3 text-center font-heading text-[28px] text-ink">
        How will you use the app?
      </Text>
      <Text className="mb-6 mt-2 max-w-[300px] text-center text-[15px] leading-6 text-tone-700">
        You can change this any time — everything stays available.
      </Text>
      {MODE_OPTIONS.map((option) => (
        <ModeCard
          key={option.mode}
          option={option}
          selected={option.mode === value}
          onSelect={onChange}
        />
      ))}
    </View>
  );
}

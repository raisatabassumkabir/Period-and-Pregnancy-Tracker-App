import type { LucideIcon } from 'lucide-react-native';
import {
  BatteryLow,
  Brain,
  CircleSlash,
  CloudLightning,
  CloudRain,
  Cookie,
  Droplet,
  Droplets,
  Flame,
  Frown,
  Heart,
  MoonStar,
  Orbit,
  PersonStanding,
  Shuffle,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { Symptom } from '@/api/cycles/types';
import { Text } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 24;

interface SymptomOption {
  code: Symptom;
  label: string;
  icon: LucideIcon;
}

/**
 * Every code the API accepts. The first four are the design's headline row;
 * the rest follow so nothing the backend can store is unreachable.
 */
const SYMPTOM_OPTIONS: readonly SymptomOption[] = [
  { code: 'cramps', label: 'Cramps', icon: Zap },
  { code: 'headache', label: 'Headache', icon: Brain },
  { code: 'fatigue', label: 'Fatigue', icon: BatteryLow },
  { code: 'bloating', label: 'Bloating', icon: Wind },
  { code: 'nausea', label: 'Nausea', icon: Frown },
  { code: 'back_pain', label: 'Back pain', icon: PersonStanding },
  { code: 'breast_tenderness', label: 'Tender', icon: Heart },
  { code: 'acne', label: 'Acne', icon: Sparkles },
  { code: 'spotting', label: 'Spotting', icon: Droplet },
  { code: 'hot_flashes', label: 'Hot flashes', icon: Flame },
  { code: 'dizziness', label: 'Dizziness', icon: Orbit },
  { code: 'insomnia', label: 'Insomnia', icon: MoonStar },
  { code: 'food_cravings', label: 'Cravings', icon: Cookie },
  { code: 'constipation', label: 'Constipation', icon: CircleSlash },
  { code: 'diarrhea', label: 'Diarrhea', icon: Droplets },
  { code: 'mood_swings', label: 'Mood swings', icon: Shuffle },
  { code: 'anxiety', label: 'Anxiety', icon: CloudLightning },
  { code: 'low_mood', label: 'Low mood', icon: CloudRain },
];

interface Props {
  selected: readonly Symptom[];
  onToggle: (symptom: Symptom) => void;
}

/** Horizontal row of circular icon buttons; the active ones turn coral. */
export function SymptomPicker({ selected, onToggle }: Props) {
  const palette = usePaletteColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID="symptom-picker"
    >
      <View className="flex-row gap-3">
        {SYMPTOM_OPTIONS.map(({ code, label, icon: Icon }) => {
          const isSelected = selected.includes(code);
          return (
            <Pressable
              key={code}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={label}
              testID={`symptom-${code}`}
              onPress={() => onToggle(code)}
              className="w-16 items-center"
            >
              <View
                // Colour-only toggle; never a runtime-toggled shadow class.
                className={`size-16 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? 'border-accent bg-accent-200'
                    : 'border-divider bg-surface'
                }`}
              >
                <Icon
                  size={ICON_SIZE}
                  color={isSelected ? palette.accent : palette.tone[600]}
                />
              </View>
              <Text
                numberOfLines={1}
                className={`mt-1.5 text-[11px] ${
                  isSelected
                    ? 'font-body-bold text-accent-700'
                    : 'font-body-semibold text-tone-700'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

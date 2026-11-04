import {
  Activity,
  Baby,
  Calendar,
  Check,
  Droplet,
  Heart,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import { Pressable, Text, View } from '@/components/ui';

const ICON_SIZE = 28;
const ICON_STROKE_WIDTH = 2;
/** ~15% alpha of the goal's hue: a soft bubble on any canvas, light or dark. */
const ICON_BUBBLE_ALPHA_HEX = '26';

export interface GoalOption {
  id: string;
  label: string;
  iconColor: string;
  icon: React.ReactNode;
}

const GOAL_OPTIONS: readonly GoalOption[] = [
  {
    id: 'get_pregnant',
    label: 'Get pregnant',
    iconColor: '#E0567A',
    icon: (
      <Heart size={ICON_SIZE} color="#E0567A" strokeWidth={ICON_STROKE_WIDTH} />
    ),
  },
  {
    id: 'track_pregnancy',
    label: 'Track my pregnancy',
    iconColor: '#6F8FD8',
    icon: (
      <Baby size={ICON_SIZE} color="#6F8FD8" strokeWidth={ICON_STROKE_WIDTH} />
    ),
  },
  {
    id: 'track_period',
    label: 'Track my period',
    iconColor: '#E86F8E',
    icon: (
      <Calendar
        size={ICON_SIZE}
        color="#E86F8E"
        strokeWidth={ICON_STROKE_WIDTH}
      />
    ),
  },
  {
    id: 'well_being',
    label: 'Take charge of my well-being',
    iconColor: '#4FAE86',
    icon: (
      <Activity
        size={ICON_SIZE}
        color="#4FAE86"
        strokeWidth={ICON_STROKE_WIDTH}
      />
    ),
  },
  {
    id: 'manage_weight',
    label: 'Manage my weight',
    iconColor: '#D9A441',
    icon: (
      <Scale size={ICON_SIZE} color="#D9A441" strokeWidth={ICON_STROKE_WIDTH} />
    ),
  },
  {
    id: 'enhance_sex_life',
    label: 'Enhance my sex life',
    iconColor: '#9B7FD9',
    icon: (
      <Sparkles
        size={ICON_SIZE}
        color="#9B7FD9"
        strokeWidth={ICON_STROKE_WIDTH}
      />
    ),
  },
  {
    id: 'decode_discharge',
    label: 'Decode my discharge',
    iconColor: '#3E9FB0',
    icon: (
      <Droplet
        size={ICON_SIZE}
        color="#3E9FB0"
        strokeWidth={ICON_STROKE_WIDTH}
      />
    ),
  },
  {
    id: 'explore_contraception',
    label: 'Explore contraception',
    iconColor: '#3E9A73',
    icon: (
      <ShieldCheck
        size={ICON_SIZE}
        color="#3E9A73"
        strokeWidth={ICON_STROKE_WIDTH}
      />
    ),
  },
];

interface StepGoalsProps {
  selectedGoals: string[];
  onToggleGoal: (id: string) => void;
}

export function StepGoals({ selectedGoals, onToggleGoal }: StepGoalsProps) {
  return (
    <ScrollView
      className="flex-1 px-6 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text className="font-display text-[26px] leading-8 text-ink">
        What brings you to Happy Women?
      </Text>
      <Text className="mt-2 font-body text-[15px] leading-6 text-tone-600">
        Choose one or more goals to personalize your daily cycle updates and
        tips.
      </Text>

      {/* 2-column grid */}
      <View className="mt-6 flex-row flex-wrap justify-between">
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);

          return (
            <Pressable
              key={goal.id}
              testID={`goal-${goal.id}`}
              onPress={() => onToggleGoal(goal.id)}
              className={`relative mb-4 min-h-[152px] w-[48%] items-center justify-center rounded-[24px] border p-4 active:opacity-85 ${
                isSelected
                  ? 'border-accent bg-surface'
                  : 'border-divider bg-surface'
              }`}
            >
              {isSelected && (
                <View className="absolute right-3 top-3 size-5 items-center justify-center rounded-full bg-accent">
                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}

              <View
                className="mb-3 size-14 items-center justify-center rounded-full"
                style={{
                  backgroundColor: goal.iconColor + ICON_BUBBLE_ALPHA_HEX,
                }}
              >
                {goal.icon}
              </View>

              {/* Two lines reserved: Android measures custom-font text before
                  wrapping and could otherwise clip a label's second line. */}
              <Text
                numberOfLines={2}
                className={`min-h-10 w-full text-center font-body-bold text-[14px] leading-5 ${
                  isSelected ? 'text-accent' : 'text-ink'
                }`}
              >
                {goal.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

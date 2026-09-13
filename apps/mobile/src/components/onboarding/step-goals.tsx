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

export interface GoalOption {
  id: string;
  label: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

const GOAL_OPTIONS: readonly GoalOption[] = [
  {
    id: 'get_pregnant',
    label: 'Get pregnant',
    iconBg: '#FFD6DA',
    iconColor: '#FF7575',
    icon: <Heart size={24} color="#FF7575" fill="#FFD6DA" />,
  },
  {
    id: 'track_pregnancy',
    label: 'Track my pregnancy',
    iconBg: '#DCEBFC',
    iconColor: '#5B9BD5',
    icon: <Baby size={24} color="#5B9BD5" />,
  },
  {
    id: 'track_period',
    label: 'Track my period',
    iconBg: '#FFE3E6',
    iconColor: '#FF9FA8',
    icon: <Calendar size={24} color="#FF9FA8" />,
  },
  {
    id: 'well_being',
    label: 'Take charge of my well-being',
    iconBg: '#E8FAF0',
    iconColor: '#48BB78',
    icon: <Activity size={24} color="#48BB78" />,
  },
  {
    id: 'manage_weight',
    label: 'Manage my weight',
    iconBg: '#FDF3D5',
    iconColor: '#D69E2E',
    icon: <Scale size={24} color="#D69E2E" />,
  },
  {
    id: 'enhance_sex_life',
    label: 'Enhance my sex life',
    iconBg: '#F5ECFA',
    iconColor: '#B7791F',
    icon: <Sparkles size={24} color="#9F7AEA" />,
  },
  {
    id: 'decode_discharge',
    label: 'Decode my discharge',
    iconBg: '#DCEBFC',
    iconColor: '#3182CE',
    icon: <Droplet size={24} color="#3182CE" />,
  },
  {
    id: 'explore_contraception',
    label: 'Explore contraception',
    iconBg: '#E8FAF0',
    iconColor: '#38A169',
    icon: <ShieldCheck size={24} color="#38A169" />,
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
      <Text className="font-heading text-[26px] leading-8 text-[#4A4A4A]">
        What brings you to Happy Women?
      </Text>
      <Text className="mt-2 font-body text-[15px] leading-6 text-[#8C8C8C]">
        Choose one or more goals to personalize your daily cycle updates and tips.
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
              className={`mb-4 w-[48%] min-h-[140px] p-4 rounded-[24px] border justify-between active:opacity-85 ${
                isSelected
                  ? 'border-[#FF9FA8] bg-white'
                  : 'border-[#F0E5E1] bg-white/95'
              }`}
              style={{
                shadowColor: isSelected ? '#FF9FA8' : '#F0E5E1',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isSelected ? 0.35 : 0.6,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View
                  className="size-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: goal.iconBg }}
                >
                  {goal.icon}
                </View>
                {isSelected && (
                  <View className="size-5 rounded-full bg-[#FF9FA8] items-center justify-center">
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>

              <Text
                className={`mt-3 font-body-bold text-[14px] leading-5 ${
                  isSelected ? 'text-[#FF7575]' : 'text-[#4A4A4A]'
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

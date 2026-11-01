import { Sparkles } from 'lucide-react-native';
import React from 'react';

import { PromptCard } from '@/components/dashboard/prompt-card';
import { View } from '@/components/ui';

interface DietNudgeCardProps {
  onPress: () => void;
}

export function DietNudgeCard({ onPress }: DietNudgeCardProps) {
  return (
    <View className="mb-5">
      <PromptCard
        icon={Sparkles}
        tone="accent2"
        title="Unlock personalized nutrition"
        subtitle="Takes less than a minute"
        body="Add your body metrics to get calorie targets and cycle-synced meal plans."
        cta={{
          label: 'Complete Profile',
          onPress,
          testID: 'diet-nudge-cta',
        }}
        testID="diet-nudge-card"
      />
    </View>
  );
}

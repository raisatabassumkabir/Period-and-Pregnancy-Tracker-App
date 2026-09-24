import { ArrowRight, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface DietNudgeCardProps {
  onPress: () => void;
}

export function DietNudgeCard({ onPress }: DietNudgeCardProps) {
  return (
    <View className="mb-6 overflow-hidden rounded-2xl bg-[#E8F3EE] p-5">
      <View className="mb-2 flex-row items-center gap-2">
        <Sparkles size={18} color="#2D5A4C" />
        <Text className="font-heading text-[17px] text-[#2D5A4C]">
          Unlock personalized nutrition
        </Text>
      </View>
      <Text className="mb-4 font-body text-[14px] leading-5 text-[#3E7060]">
        Add your body metrics to get calorie targets and cycle-synced meal
        plans.
      </Text>
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center self-start rounded-full bg-[#2D5A4C] px-5 py-2.5 active:bg-[#204036]"
      >
        <Text className="mr-2 font-body-bold text-[14px] text-white">
          Complete Profile
        </Text>
        <ArrowRight size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

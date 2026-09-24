import { Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import { Pressable, Text, View } from '@/components/ui';

const ACQUISITION_CHANNELS: readonly string[] = [
  'Google Search or Play Store',
  'Friends or Family',
  'Instagram or Facebook',
  'TikTok',
  'YouTube',
  'Healthcare Professional',
  'Podcast or Article',
  'Other',
];

interface StepAcquisitionProps {
  selectedSource: string;
  onSelectSource: (source: string) => void;
}

export function StepAcquisition({
  selectedSource,
  onSelectSource,
}: StepAcquisitionProps) {
  return (
    <ScrollView
      className="flex-1 px-6 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text className="font-heading text-[26px] leading-8 text-[#4A4A4A]">
        How did you find out about us?
      </Text>
      <Text className="mt-2 font-body text-[15px] leading-6 text-[#8C8C8C]">
        This helps us understand how women discover Happy Women so we can reach
        more people.
      </Text>

      <View className="mt-6 gap-3">
        {ACQUISITION_CHANNELS.map((channel) => {
          const isSelected = selectedSource === channel;

          return (
            <Pressable
              key={channel}
              testID={`acquisition-${channel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              onPress={() => onSelectSource(channel)}
              className={`flex-row items-center justify-between rounded-[20px] border p-4 active:opacity-85 ${
                isSelected
                  ? 'border-[#FF9FA8] bg-white'
                  : 'border-[#F0E5E1] bg-white/95'
              }`}
              style={{
                shadowColor: isSelected ? '#FF9FA8' : '#F0E5E1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isSelected ? 0.25 : 0.5,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text
                className={`font-body-bold text-[15px] ${
                  isSelected ? 'text-[#FF7575]' : 'text-[#4A4A4A]'
                }`}
              >
                {channel}
              </Text>

              <View
                className={`size-6 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? 'border-[#FF9FA8] bg-[#FF9FA8]'
                    : 'border-[#F0E5E1] bg-[#FCF8F5]'
                }`}
              >
                {isSelected && (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

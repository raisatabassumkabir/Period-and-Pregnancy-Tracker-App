import { Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import { Pressable, Text, View } from '@/components/ui';

export interface MedicalConditionOption {
  id: string;
  label: string;
  isExclusive?: boolean;
}

const MEDICAL_OPTIONS: readonly MedicalConditionOption[] = [
  { id: 'yeast_infections', label: 'Yeast infections' },
  { id: 'utis', label: 'UTIs (Urinary Tract Infections)' },
  { id: 'bv', label: 'BV (Bacterial Vaginosis)' },
  { id: 'pcos', label: 'PCOS (Polycystic Ovary Syndrome)' },
  { id: 'endometriosis', label: 'Endometriosis' },
  { id: 'fibroids', label: 'Uterine Fibroids' },
  { id: 'not_sure', label: "I'm not sure", isExclusive: true },
  { id: 'none', label: 'None', isExclusive: true },
];

interface StepMedicalProps {
  selectedConditions: string[];
  onToggleCondition: (id: string) => void;
}

export function StepMedical({
  selectedConditions,
  onToggleCondition,
}: StepMedicalProps) {
  return (
    <ScrollView
      className="flex-1 px-6 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text className="font-heading text-[26px] leading-8 text-[#4A4A4A]">
        Do you have any of these health conditions?
      </Text>
      <Text className="mt-2 font-body text-[15px] leading-6 text-[#8C8C8C]">
        Choose all that apply. Your information remains completely private,
        secure, and encrypted.
      </Text>

      <View className="mt-6 gap-3">
        {MEDICAL_OPTIONS.map((item) => {
          const isSelected = selectedConditions.includes(item.id);

          return (
            <Pressable
              key={item.id}
              testID={`condition-${item.id}`}
              onPress={() => onToggleCondition(item.id)}
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
                {item.label}
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

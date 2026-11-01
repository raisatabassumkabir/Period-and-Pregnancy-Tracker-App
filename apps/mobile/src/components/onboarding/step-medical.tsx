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
      <Text className="font-heading text-[26px] leading-8 text-ink">
        Do you have any of these health conditions?
      </Text>
      <Text className="mt-2 font-body text-[15px] leading-6 text-tone-600">
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
                  ? 'border-accent bg-surface'
                  : 'border-divider bg-surface'
              }`}
            >
              <Text
                className={`font-body-bold text-[15px] ${
                  isSelected ? 'text-accent' : 'text-ink'
                }`}
              >
                {item.label}
              </Text>

              <View
                className={`size-6 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? 'border-accent bg-accent'
                    : 'border-divider bg-canvas'
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

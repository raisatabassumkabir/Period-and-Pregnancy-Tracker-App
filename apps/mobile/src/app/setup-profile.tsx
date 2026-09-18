import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

import type { MedicalCondition } from '@/api/types';
import {
  Button,
  FocusAwareStatusBar,
  Pressable,
  SafeAreaView,
  Text,
} from '@/components/ui';
import { usePaletteColors } from '@/lib';
import { usePersonalizationProfile } from '@/lib/health/use-personalization-profile';
import { DatePickerModal } from '@/components/settings/personalization-item';

type Step = 'goals' | 'info' | 'medical_source';

const GOAL_OPTIONS = [
  { id: 'sync_sex_life', label: 'Sync my sex life with my cycle', icon: '❤️' },
  { id: 'masturbation', label: 'Make masturbation work for me', icon: '🎉' },
  { id: 'pcos_endo', label: 'Spot signs of PCOS or Endometriosis', icon: '🎗️' },
  { id: 'discharge', label: 'Decode my discharge', icon: '💧' },
  { id: 'symptoms', label: 'Manage symptoms and moods', icon: '🧘‍♀️' },
  { id: 'orgasm', label: 'Learn how to orgasm', icon: '✨' },
];

const SOURCE_OPTIONS = [
  'Google Play or Google search',
  'Friends or Family',
  'Instagram or Facebook',
  'TikTok',
  'YouTube',
  'TV or Streaming',
  'Influencer or Celebrity',
  'Medical professional',
];

const MEDICAL_CONDITIONS_LIST: { id: MedicalCondition; label: string }[] = [
  { id: 'pcos', label: 'PCOS' },
  { id: 'endometriosis', label: 'Endometriosis' },
  { id: 'thyroid_disorder', label: 'Thyroid Disorder' },
  { id: 'anemia', label: 'Anemia' },
  { id: 'diabetes', label: 'Diabetes' },
];

export default function SetupProfile() {
  const router = useRouter();
  const palette = usePaletteColors();
  const { updateProfile } = usePersonalizationProfile();

  const [step, setStep] = React.useState<Step>('goals');
  const [goals, setGoals] = React.useState<string[]>([]);
  const [fullName, setFullName] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [conditions, setConditions] = React.useState<MedicalCondition[]>([]);
  const [source, setSource] = React.useState<string>('');
  const [isDatePickerVisible, setDatePickerVisible] = React.useState(false);

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleCondition = (id: MedicalCondition) => {
    setConditions((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    await updateProfile({
      fullName: fullName || 'Happy User', // Default if skipped
      dateOfBirth,
      height,
      weight,
      medicalConditions: conditions,
      goals,
      source,
    });
    router.replace('/(app)');
  };

  const renderProgressBar = (progress: number) => (
    <View className="mb-6 h-1 w-full flex-row rounded-full bg-divider overflow-hidden">
      <View
        className="h-full bg-accent"
        style={{ width: `${progress * 100}%` }}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          {step === 'goals' && (
            <TouchableOpacity onPress={() => router.replace('/(app)')}>
              <Text className="font-body-semibold text-[15px] text-tone-600">
                Cancel
              </Text>
            </TouchableOpacity>
          )}
          {step === 'info' && (
            <TouchableOpacity onPress={() => setStep('goals')}>
              <Text className="font-body-semibold text-[20px] text-ink">←</Text>
            </TouchableOpacity>
          )}
          {step === 'medical_source' && (
            <TouchableOpacity onPress={() => setStep('info')}>
              <Text className="font-body-semibold text-[20px] text-ink">←</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleFinish}>
            <Text className="font-body-semibold text-[15px] text-tone-500">
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerClassName="px-6 pb-12 pt-2 flex-grow"
          showsVerticalScrollIndicator={false}
        >
          {step === 'goals' && (
            <View className="flex-1">
              {renderProgressBar(0.33)}
              <Text className="mb-2 text-center font-heading text-[28px] text-ink">
                What can we help you do?
              </Text>
              <Text className="mb-8 text-center text-[15px] text-tone-600">
                Choose as many as you like.
              </Text>

              <View className="flex-row flex-wrap justify-between">
                {GOAL_OPTIONS.map((g) => {
                  const active = goals.includes(g.id);
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => toggleGoal(g.id)}
                      className={`mb-4 w-[48%] items-center justify-center rounded-[24px] border p-4 ${
                        active
                          ? 'border-accent bg-accent/5'
                          : 'border-divider bg-surface shadow-sm'
                      }`}
                      style={{ height: 140 }}
                    >
                      <View className="mb-3 size-12 items-center justify-center rounded-full bg-canvas">
                        <Text className="text-[24px]">{g.icon}</Text>
                      </View>
                      <Text
                        className={`text-center font-body-semibold text-[13px] ${
                          active ? 'text-accent-800' : 'text-ink'
                        }`}
                      >
                        {g.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="mt-auto pt-6">
                <Button
                  label="Next"
                  size="lg"
                  className="rounded-pill"
                  onPress={() => setStep('info')}
                  disabled={goals.length === 0}
                />
              </View>
            </View>
          )}

          {step === 'info' && (
            <View className="flex-1">
              {renderProgressBar(0.66)}
              <Text className="mb-2 text-center font-heading text-[28px] text-ink">
                Let's get to know you
              </Text>
              <Text className="mb-8 text-center text-[15px] text-tone-600">
                This helps us personalize your insights.
              </Text>

              <View className="mb-5">
                <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                  FULL NAME
                </Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="E.g. Sarah"
                  placeholderTextColor={palette.tone[500]}
                  className="h-14 rounded-xl border border-divider bg-surface px-4 font-body text-[16px] text-ink shadow-sm"
                />
              </View>

              <View className="mb-5">
                <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                  DATE OF BIRTH
                </Text>
                <Pressable
                  onPress={() => setDatePickerVisible(true)}
                  className="h-14 justify-center rounded-xl border border-divider bg-surface px-4 shadow-sm"
                >
                  <Text
                    className={`font-body text-[16px] ${
                      dateOfBirth ? 'text-ink' : 'text-tone-500'
                    }`}
                  >
                    {dateOfBirth || 'YYYY-MM-DD'}
                  </Text>
                </Pressable>
              </View>

              <View className="mb-5 flex-row gap-4">
                <View className="flex-1">
                  <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                    HEIGHT (cm)
                  </Text>
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    placeholder="165"
                    keyboardType="numeric"
                    placeholderTextColor={palette.tone[500]}
                    className="h-14 rounded-xl border border-divider bg-surface px-4 font-body text-[16px] text-ink shadow-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                    WEIGHT (kg)
                  </Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="60"
                    keyboardType="numeric"
                    placeholderTextColor={palette.tone[500]}
                    className="h-14 rounded-xl border border-divider bg-surface px-4 font-body text-[16px] text-ink shadow-sm"
                  />
                </View>
              </View>

              <View className="mt-auto pt-6">
                <Button
                  label="Next"
                  size="lg"
                  className="rounded-pill"
                  onPress={() => setStep('medical_source')}
                  disabled={!fullName}
                />
              </View>
            </View>
          )}

          {step === 'medical_source' && (
            <View className="flex-1">
              {renderProgressBar(1.0)}
              <Text className="mb-8 text-center font-heading text-[28px] text-ink">
                How did you find out about us?
              </Text>

              {SOURCE_OPTIONS.map((opt) => {
                const active = source === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setSource(opt)}
                    className={`mb-3 h-14 w-full justify-center rounded-xl border px-5 ${
                      active
                        ? 'border-accent bg-accent/5'
                        : 'border-black/5 bg-surface shadow-sm'
                    }`}
                  >
                    <Text
                      className={`font-body text-[16px] ${
                        active ? 'font-body-bold text-accent-800' : 'text-ink'
                      }`}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}

              <Text className="mb-4 mt-8 font-body-semibold text-[13px] text-tone-700">
                ANY MEDICAL CONDITIONS? (Optional)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {MEDICAL_CONDITIONS_LIST.map((c) => {
                  const active = conditions.includes(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleCondition(c.id)}
                      className={`rounded-full border px-4 py-2.5 ${
                        active
                          ? 'border-accent bg-accent/10'
                          : 'border-divider bg-surface shadow-sm'
                      }`}
                    >
                      <Text
                        className={`font-body-semibold text-[13px] ${
                          active ? 'text-accent-800' : 'text-ink'
                        }`}
                      >
                        {active ? `✓ ${c.label}` : c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="mt-auto pt-10">
                <Button
                  label="Finish"
                  size="lg"
                  className="rounded-pill"
                  onPress={handleFinish}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {isDatePickerVisible && (
        <DatePickerModal
          initialDate={dateOfBirth}
          onClose={() => setDatePickerVisible(false)}
          onSelect={(date) => {
            setDateOfBirth(date);
            setDatePickerVisible(false);
          }}
        />
      )}
    </View>
  );
}

import { User } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';

import type {
  DietPreference,
  MedicalCondition,
  ProfileMode,
} from '@/api/types';
import { Button, Pressable, Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib';
import { usePersonalizationProfile } from '@/lib/health/use-personalization-profile';

import { Item } from './item';

const ICON_SIZE = 18;

const MODE_LABELS: Record<ProfileMode, string> = {
  cycle_tracking: 'Cycle Tracking',
  trying_to_conceive: 'Trying to Conceive',
  pregnancy: 'Pregnancy',
  postpartum: 'Postpartum',
};

const DIET_LABELS: Record<DietPreference, string> = {
  unspecified: 'Not specified',
  omnivore: 'Omnivore',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  halal: 'Halal',
  kosher: 'Kosher',
};

const MEDICAL_CONDITIONS_LIST: { id: MedicalCondition; label: string }[] = [
  { id: 'pcos', label: 'PCOS' },
  { id: 'pcod', label: 'PCOD' },
  { id: 'endometriosis', label: 'Endometriosis' },
  { id: 'thyroid_disorder', label: 'Thyroid Disorder' },
  { id: 'anemia', label: 'Anemia' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'fibroids', label: 'Fibroids' },
  { id: 'hypertension', label: 'Hypertension' },
];

export const PersonalizationItem = () => {
  const { profile, updateProfile } = usePersonalizationProfile();
  const palette = usePaletteColors();
  const [modalVisible, setModalVisible] = React.useState(false);

  // Form State
  const [fullName, setFullName] = React.useState(profile.fullName);
  const [dateOfBirth, setDateOfBirth] = React.useState(profile.dateOfBirth);
  const [mode, setMode] = React.useState<ProfileMode>(profile.mode);
  const [diet, setDiet] = React.useState<DietPreference>(profile.diet);
  const [selectedConditions, setSelectedConditions] = React.useState<
    MedicalCondition[]
  >(profile.medicalConditions || []);

  React.useEffect(() => {
    if (modalVisible) {
      setFullName(profile.fullName);
      setDateOfBirth(profile.dateOfBirth);
      setMode(profile.mode);
      setDiet(profile.diet);
      setSelectedConditions(profile.medicalConditions || []);
    }
  }, [modalVisible, profile]);

  const toggleCondition = (id: MedicalCondition) => {
    setSelectedConditions((current) =>
      current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id]
    );
  };

  const handleSave = async () => {
    await updateProfile({
      fullName,
      dateOfBirth,
      mode,
      diet,
      medicalConditions: selectedConditions,
    });
    setModalVisible(false);
  };

  const summaryText = `${profile.fullName || 'User'}, ${profile.age} yrs`;

  return (
    <>
      <Item
        testID="personalization-item"
        onPress={() => setModalVisible(true)}
        icon={<User size={ICON_SIZE} color={palette.accent} />}
        text="settings.profile_options"
        value={summaryText}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="max-h-[90%] rounded-t-3xl bg-surface px-5 pb-8 pt-6">
            <View className="mb-4 flex-row items-center justify-between border-b border-divider pb-3">
              <Text className="font-heading text-[20px] text-ink">
                Personalization Options
              </Text>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-2 py-1"
              >
                <Text className="font-body-bold text-[16px] text-accent">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Full Name */}
              <View className="mb-5">
                <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                  FULL NAME
                </Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={palette.tone[500]}
                  className="h-12 rounded-xl border border-divider bg-canvas px-4 font-body text-[15px] text-ink"
                />
              </View>

              {/* Date of Birth / Age */}
              <View className="mb-5">
                <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                  DATE OF BIRTH (YYYY-MM-DD)
                </Text>
                <TextInput
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={palette.tone[500]}
                  className="h-12 rounded-xl border border-divider bg-canvas px-4 font-body text-[15px] text-ink"
                />
              </View>

              {/* Tracking Mode */}
              <View className="mb-5">
                <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                  TRACKING MODE
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(
                    [
                      'cycle_tracking',
                      'trying_to_conceive',
                      'pregnancy',
                      'postpartum',
                    ] as ProfileMode[]
                  ).map((m) => {
                    const active = mode === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMode(m)}
                        className={`rounded-full border px-4 py-2.5 ${
                          active
                            ? 'border-accent bg-accent'
                            : 'border-divider bg-canvas'
                        }`}
                      >
                        <Text
                          className={`font-body-semibold text-[13px] ${
                            active ? 'text-accent-100' : 'text-ink'
                          }`}
                        >
                          {MODE_LABELS[m]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Dietary Preference */}
              <View className="mb-5">
                <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                  DIETARY PREFERENCE
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(
                    [
                      'omnivore',
                      'vegetarian',
                      'vegan',
                      'pescatarian',
                      'halal',
                      'kosher',
                    ] as DietPreference[]
                  ).map((d) => {
                    const active = diet === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setDiet(d)}
                        className={`rounded-full border px-3.5 py-2 ${
                          active
                            ? 'border-accent bg-accent'
                            : 'border-divider bg-canvas'
                        }`}
                      >
                        <Text
                          className={`font-body-semibold text-[13px] ${
                            active ? 'text-accent-100' : 'text-ink'
                          }`}
                        >
                          {DIET_LABELS[d]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Health Conditions */}
              <View className="mb-6">
                <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
                  MEDICAL / HEALTH CONDITIONS
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {MEDICAL_CONDITIONS_LIST.map((item) => {
                    const active = selectedConditions.includes(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => toggleCondition(item.id)}
                        className={`rounded-full border px-3.5 py-2 ${
                          active
                            ? 'border-accent bg-accent/20'
                            : 'border-divider bg-canvas'
                        }`}
                      >
                        <Text
                          className={`font-body-semibold text-[13px] ${
                            active ? 'text-accent' : 'text-ink'
                          }`}
                        >
                          {active ? `✓ ${item.label}` : item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Save Button */}
              <Button
                label="Save Changes"
                onPress={handleSave}
                size="lg"
                className="mt-2 rounded-pill"
                testID="save-personalization"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

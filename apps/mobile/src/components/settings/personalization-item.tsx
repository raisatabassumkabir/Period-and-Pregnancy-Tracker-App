import { Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react-native';
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

interface DateOfBirthInputProps {
  value: string;
  onChange: (val: string) => void;
}

function DatePickerModal({
  initialDate,
  onClose,
  onSelect,
}: {
  initialDate: string;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
}) {
  const palette = usePaletteColors();
  const parsed = React.useMemo(() => {
    const parts = (initialDate || '').split('-');
    const y = parseInt(parts[0], 10) || 2000;
    const m = parseInt(parts[1], 10) || 1;
    const d = parseInt(parts[2], 10) || 15;
    return { year: y, month: Math.max(1, Math.min(12, m)), day: Math.max(1, Math.min(31, d)) };
  }, [initialDate]);

  const [selectedYear, setSelectedYear] = React.useState(parsed.year);
  const [selectedMonth, setSelectedMonth] = React.useState(parsed.month);
  const [selectedDay, setSelectedDay] = React.useState(parsed.day);

  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= 1920; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const daysInMonth = React.useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const handleConfirm = () => {
    const safeDay = Math.min(selectedDay, daysInMonth);
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(safeDay).padStart(2, '0');
    onSelect(`${selectedYear}-${mm}-${dd}`);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/60 p-5">
        <View className="rounded-3xl bg-surface p-6 shadow-xl">
          <View className="mb-4 flex-row items-center justify-between border-b border-divider pb-3">
            <Text className="font-heading text-lg text-ink">Select Date of Birth</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="font-body-bold text-sm text-accent">Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Year selector */}
          <Text className="mb-1.5 font-body-semibold text-xs text-tone-700">YEAR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row gap-2">
            {years.map((y) => {
              const active = y === selectedYear;
              return (
                <Pressable
                  key={y}
                  onPress={() => setSelectedYear(y)}
                  className={`rounded-full px-3.5 py-1.5 border ${
                    active ? 'border-accent bg-accent' : 'border-divider bg-canvas'
                  }`}
                >
                  <Text className={`font-body-semibold text-xs ${active ? 'text-accent-100' : 'text-ink'}`}>
                    {y}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Month selector */}
          <Text className="mb-1.5 font-body-semibold text-xs text-tone-700">MONTH</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {monthNames.map((name, idx) => {
              const mVal = idx + 1;
              const active = mVal === selectedMonth;
              return (
                <Pressable
                  key={name}
                  onPress={() => setSelectedMonth(mVal)}
                  className={`rounded-full px-3 py-1.5 border ${
                    active ? 'border-accent bg-accent' : 'border-divider bg-canvas'
                  }`}
                >
                  <Text className={`font-body-semibold text-xs ${active ? 'text-accent-100' : 'text-ink'}`}>
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Day selector */}
          <Text className="mb-1.5 font-body-semibold text-xs text-tone-700">DAY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 flex-row gap-1.5">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const active = d === selectedDay;
              return (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDay(d)}
                  className={`size-9 items-center justify-center rounded-full border ${
                    active ? 'border-accent bg-accent' : 'border-divider bg-canvas'
                  }`}
                >
                  <Text className={`font-body-semibold text-xs ${active ? 'text-accent-100' : 'text-ink'}`}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Button label="Confirm Date" onPress={handleConfirm} size="default" className="rounded-pill" />
        </View>
      </View>
    </Modal>
  );
}

export function DateOfBirthInput({ value, onChange }: DateOfBirthInputProps) {
  const palette = usePaletteColors();
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleTextChange = (text: string) => {
    // Only numeric digits allowed - prevents characters like 'T'
    const digitsOnly = text.replace(/[^0-9]/g, '');
    let formatted = digitsOnly;
    if (digitsOnly.length > 4) {
      formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}`;
    }
    if (digitsOnly.length > 6) {
      formatted = `${formatted}-${digitsOnly.slice(6, 8)}`;
    }

    onChange(formatted);

    if (formatted.length === 10) {
      const year = parseInt(formatted.slice(0, 4), 10);
      const month = parseInt(formatted.slice(5, 7), 10);
      const day = parseInt(formatted.slice(8, 10), 10);
      const currentYear = new Date().getFullYear();

      if (year < 1920 || year > currentYear) {
        setValidationError(`Year must be between 1920 and ${currentYear}`);
      } else if (month < 1 || month > 12) {
        setValidationError('Month must be between 01 and 12');
      } else if (day < 1 || day > 31) {
        setValidationError('Day must be between 01 and 31');
      } else {
        const testDate = new Date(year, month - 1, day);
        if (
          testDate.getFullYear() !== year ||
          testDate.getMonth() !== month - 1 ||
          testDate.getDate() !== day
        ) {
          setValidationError('Invalid calendar date');
        } else if (testDate > new Date()) {
          setValidationError('Date of birth cannot be in the future');
        } else {
          setValidationError(null);
        }
      }
    } else {
      setValidationError(null);
    }
  };

  return (
    <View>
      <View className="relative flex-row items-center">
        <TextInput
          value={value}
          onChangeText={handleTextChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.tone[500]}
          keyboardType="numeric"
          maxLength={10}
          testID="dob-input"
          className="h-12 flex-1 rounded-xl border border-divider bg-canvas px-4 pr-12 font-body text-[15px] text-ink"
        />
        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          className="absolute right-3.5 p-1"
          testID="dob-picker-button"
          accessibilityLabel="Open date picker"
        >
          <Calendar size={20} color={palette.accent} />
        </TouchableOpacity>
      </View>

      {validationError && (
        <Text className="mt-1 font-body text-xs text-red-500">
          {validationError}
        </Text>
      )}

      {pickerVisible && (
        <DatePickerModal
          initialDate={value}
          onClose={() => setPickerVisible(false)}
          onSelect={(selectedDate) => {
            onChange(selectedDate);
            setValidationError(null);
            setPickerVisible(false);
          }}
        />
      )}
    </View>
  );
}

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
                <DateOfBirthInput
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
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

import { Ruler, Scale, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/ui';

interface StepBodyMetricsProps {
  heightCm: string; // e.g. "165"
  weightKg: string; // e.g. "60"
  onChangeHeight: (cm: string) => void;
  onChangeWeight: (kg: string) => void;
}

type UnitSystem = 'metric' | 'imperial';

export function StepBodyMetrics({
  heightCm,
  weightKg,
  onChangeHeight,
  onChangeWeight,
}: StepBodyMetricsProps) {
  const [unit, setUnit] = useState<UnitSystem>('metric');

  // Imperial local state
  const cmVal = parseFloat(heightCm) || 0;
  const totalInches = cmVal > 0 ? Math.round(cmVal / 2.54) : 0;
  const initialFeet = Math.floor(totalInches / 12);
  const initialInches = totalInches % 12;

  const kgVal = parseFloat(weightKg) || 0;
  const initialLbs = kgVal > 0 ? Math.round(kgVal * 2.20462) : 0;

  const [feet, setFeet] = useState<string>(initialFeet > 0 ? String(initialFeet) : '');
  const [inches, setInches] = useState<string>(initialInches > 0 ? String(initialInches) : '');
  const [lbs, setLbs] = useState<string>(initialLbs > 0 ? String(initialLbs) : '');

  const handleUnitToggle = (selected: UnitSystem) => {
    if (selected === unit) return;
    if (selected === 'imperial') {
      const currentCm = parseFloat(heightCm) || 0;
      if (currentCm > 0) {
        const totIn = Math.round(currentCm / 2.54);
        setFeet(String(Math.floor(totIn / 12)));
        setInches(String(totIn % 12));
      }
      const currentKg = parseFloat(weightKg) || 0;
      if (currentKg > 0) {
        setLbs(String(Math.round(currentKg * 2.20462)));
      }
    } else {
      // Switched to metric
      const ft = parseFloat(feet) || 0;
      const inch = parseFloat(inches) || 0;
      if (ft > 0 || inch > 0) {
        onChangeHeight(String(Math.round(ft * 30.48 + inch * 2.54)));
      }
      const p = parseFloat(lbs) || 0;
      if (p > 0) {
        onChangeWeight(String(Math.round(p / 2.20462)));
      }
    }
    setUnit(selected);
  };

  const handleFeetChange = (val: string) => {
    setFeet(val);
    const ft = parseFloat(val) || 0;
    const inch = parseFloat(inches) || 0;
    const computedCm = Math.round(ft * 30.48 + inch * 2.54);
    onChangeHeight(computedCm > 0 ? String(computedCm) : '');
  };

  const handleInchesChange = (val: string) => {
    setInches(val);
    const ft = parseFloat(feet) || 0;
    const inch = parseFloat(val) || 0;
    const computedCm = Math.round(ft * 30.48 + inch * 2.54);
    onChangeHeight(computedCm > 0 ? String(computedCm) : '');
  };

  const handleLbsChange = (val: string) => {
    setLbs(val);
    const p = parseFloat(val) || 0;
    const computedKg = Math.round(p / 2.20462);
    onChangeWeight(computedKg > 0 ? String(computedKg) : '');
  };

  return (
    <View className="flex-1 px-6 pt-4" testID="step-body-metrics">
      <Text className="font-heading text-2xl leading-8 text-[#4A4A4A]">
        Help us personalize your nutrition
      </Text>
      <Text className="font-body mt-2 text-sm leading-5 text-[#8C8C8C]">
        Our diet engine tailors meal plans, calorie targets, and cycle nutrition based on your body metrics.
      </Text>

      {/* Unit Selector Toggle */}
      <View className="mt-6 flex-row self-center rounded-full bg-white p-1" style={{
        shadowColor: '#F0E5E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 2,
      }}>
        <Pressable
          accessibilityRole="button"
          testID="unit-metric"
          onPress={() => handleUnitToggle('metric')}
          className={`rounded-full px-5 py-2 ${
            unit === 'metric' ? 'bg-[#FF9FA8]' : 'bg-transparent'
          }`}
        >
          <Text
            className={`font-heading text-xs ${
              unit === 'metric' ? 'text-white' : 'text-[#8C8C8C]'
            }`}
          >
            Metric (cm / kg)
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          testID="unit-imperial"
          onPress={() => handleUnitToggle('imperial')}
          className={`rounded-full px-5 py-2 ${
            unit === 'imperial' ? 'bg-[#FF9FA8]' : 'bg-transparent'
          }`}
        >
          <Text
            className={`font-heading text-xs ${
              unit === 'imperial' ? 'text-white' : 'text-[#8C8C8C]'
            }`}
          >
            Imperial (ft / lbs)
          </Text>
        </Pressable>
      </View>

      <View className="mt-6 gap-5">
        {/* Height Input Card */}
        <View
          className="rounded-[24px] bg-white p-5"
          style={{
            shadowColor: '#F0E5E1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-11 items-center justify-center rounded-full bg-[#E8F1FC]">
              <Ruler size={22} color="#6BA4E8" strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-base text-[#4A4A4A]">Height</Text>
              <Text className="font-body text-xs text-[#8C8C8C]">
                {unit === 'metric' ? 'Enter height in centimeters' : 'Enter feet and inches'}
              </Text>
            </View>
          </View>

          <View className="mt-4">
            {unit === 'metric' ? (
              <View className="flex-row items-center rounded-[18px] bg-[#FCF8F5] px-4 py-3">
                <TextInput
                  testID="height-input-metric"
                  accessibilityLabel="Height in centimeters"
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={onChangeHeight}
                  placeholder="e.g. 165"
                  placeholderTextColor="#B0A8A4"
                  className="flex-1 font-heading text-xl text-[#4A4A4A]"
                />
                <Text className="font-body text-sm text-[#8C8C8C]">cm</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-3">
                <View className="flex-1 flex-row items-center rounded-[18px] bg-[#FCF8F5] px-4 py-3">
                  <TextInput
                    testID="height-input-ft"
                    accessibilityLabel="Height in feet"
                    keyboardType="numeric"
                    value={feet}
                    onChangeText={handleFeetChange}
                    placeholder="5"
                    placeholderTextColor="#B0A8A4"
                    className="flex-1 font-heading text-xl text-[#4A4A4A]"
                  />
                  <Text className="font-body text-sm text-[#8C8C8C]">ft</Text>
                </View>
                <View className="flex-1 flex-row items-center rounded-[18px] bg-[#FCF8F5] px-4 py-3">
                  <TextInput
                    testID="height-input-in"
                    accessibilityLabel="Height in inches"
                    keyboardType="numeric"
                    value={inches}
                    onChangeText={handleInchesChange}
                    placeholder="5"
                    placeholderTextColor="#B0A8A4"
                    className="flex-1 font-heading text-xl text-[#4A4A4A]"
                  />
                  <Text className="font-body text-sm text-[#8C8C8C]">in</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Weight Input Card */}
        <View
          className="rounded-[24px] bg-white p-5"
          style={{
            shadowColor: '#F0E5E1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-11 items-center justify-center rounded-full bg-[#FCF4DE]">
              <Scale size={22} color="#D9A838" strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-base text-[#4A4A4A]">Weight</Text>
              <Text className="font-body text-xs text-[#8C8C8C]">
                {unit === 'metric' ? 'Enter weight in kilograms' : 'Enter weight in pounds'}
              </Text>
            </View>
          </View>

          <View className="mt-4">
            {unit === 'metric' ? (
              <View className="flex-row items-center rounded-[18px] bg-[#FCF8F5] px-4 py-3">
                <TextInput
                  testID="weight-input-metric"
                  accessibilityLabel="Weight in kilograms"
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={onChangeWeight}
                  placeholder="e.g. 60"
                  placeholderTextColor="#B0A8A4"
                  className="flex-1 font-heading text-xl text-[#4A4A4A]"
                />
                <Text className="font-body text-sm text-[#8C8C8C]">kg</Text>
              </View>
            ) : (
              <View className="flex-row items-center rounded-[18px] bg-[#FCF8F5] px-4 py-3">
                <TextInput
                  testID="weight-input-imperial"
                  accessibilityLabel="Weight in pounds"
                  keyboardType="numeric"
                  value={lbs}
                  onChangeText={handleLbsChange}
                  placeholder="e.g. 132"
                  placeholderTextColor="#B0A8A4"
                  className="flex-1 font-heading text-xl text-[#4A4A4A]"
                />
                <Text className="font-body text-sm text-[#8C8C8C]">lbs</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

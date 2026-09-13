import { Calendar, Droplet, Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';

interface StepCycleBaselineProps {
  cycleLength: number;
  periodDuration: number;
  onChangeCycleLength: (val: number) => void;
  onChangePeriodDuration: (val: number) => void;
}

const MIN_CYCLE_LENGTH = 15;
const MAX_CYCLE_LENGTH = 60;
const MIN_PERIOD_DURATION = 1;
const MAX_PERIOD_DURATION = 15;

export function StepCycleBaseline({
  cycleLength,
  periodDuration,
  onChangeCycleLength,
  onChangePeriodDuration,
}: StepCycleBaselineProps) {
  const handleDecCycle = () => {
    if (cycleLength > MIN_CYCLE_LENGTH) {
      onChangeCycleLength(cycleLength - 1);
    }
  };

  const handleIncCycle = () => {
    if (cycleLength < MAX_CYCLE_LENGTH) {
      onChangeCycleLength(cycleLength + 1);
    }
  };

  const handleDecPeriod = () => {
    if (periodDuration > MIN_PERIOD_DURATION) {
      onChangePeriodDuration(periodDuration - 1);
    }
  };

  const handleIncPeriod = () => {
    if (periodDuration < MAX_PERIOD_DURATION) {
      onChangePeriodDuration(periodDuration + 1);
    }
  };

  return (
    <View className="flex-1 px-6 pt-4" testID="step-cycle-baseline">
      <Text className="font-heading text-2xl leading-8 text-[#4A4A4A]">
        Tell us about your cycle
      </Text>
      <Text className="font-body mt-2 text-sm leading-5 text-[#8C8C8C]">
        This helps us predict your fertile window, ovulation days, and next period.
      </Text>

      <View className="mt-8 gap-5">
        {/* Average Cycle Length Card */}
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
            <View className="size-11 items-center justify-center rounded-full bg-[#FFE5E8]">
              <Calendar size={22} color="#FF9FA8" strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-base text-[#4A4A4A]">
                Average Cycle Length
              </Text>
              <Text className="font-body text-xs text-[#8C8C8C]">
                First day of one period to the next
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row items-center justify-between rounded-full bg-[#FCF8F5] p-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease cycle length"
              testID="cycle-length-dec"
              onPress={handleDecCycle}
              className="size-11 items-center justify-center rounded-full bg-white active:scale-95"
              style={{
                shadowColor: '#F0E5E1',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Minus size={20} color="#4A4A4A" strokeWidth={2.5} />
            </Pressable>

            <View className="flex-row items-baseline gap-1" testID="cycle-length-value">
              <Text className="font-heading text-3xl text-[#4A4A4A]">
                {cycleLength}
              </Text>
              <Text className="font-body text-sm text-[#8C8C8C]">days</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase cycle length"
              testID="cycle-length-inc"
              onPress={handleIncCycle}
              className="size-11 items-center justify-center rounded-full bg-white active:scale-95"
              style={{
                shadowColor: '#F0E5E1',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Plus size={20} color="#4A4A4A" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Average Period Duration Card */}
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
            <View className="size-11 items-center justify-center rounded-full bg-[#E5F7ED]">
              <Droplet size={22} color="#5CC98B" strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-base text-[#4A4A4A]">
                Average Period Duration
              </Text>
              <Text className="font-body text-xs text-[#8C8C8C]">
                How many days bleeding usually lasts
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row items-center justify-between rounded-full bg-[#FCF8F5] p-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease period duration"
              testID="period-duration-dec"
              onPress={handleDecPeriod}
              className="size-11 items-center justify-center rounded-full bg-white active:scale-95"
              style={{
                shadowColor: '#F0E5E1',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Minus size={20} color="#4A4A4A" strokeWidth={2.5} />
            </Pressable>

            <View className="flex-row items-baseline gap-1" testID="period-duration-value">
              <Text className="font-heading text-3xl text-[#4A4A4A]">
                {periodDuration}
              </Text>
              <Text className="font-body text-sm text-[#8C8C8C]">days</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase period duration"
              testID="period-duration-inc"
              onPress={handleIncPeriod}
              className="size-11 items-center justify-center rounded-full bg-white active:scale-95"
              style={{
                shadowColor: '#F0E5E1',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Plus size={20} color="#4A4A4A" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

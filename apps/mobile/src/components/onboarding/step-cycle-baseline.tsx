import { Calendar, Droplet, Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

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
  const palette = usePaletteColors();
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
      <Text className="font-heading text-2xl leading-8 text-ink">
        Tell us about your cycle
      </Text>
      <Text className="mt-2 font-body text-sm leading-5 text-tone-600">
        This helps us predict your fertile window, ovulation days, and next
        period.
      </Text>

      <View className="mt-8 gap-5">
        {/* Average Cycle Length Card */}
        <View className="rounded-[24px] bg-surface p-5">
          <View className="flex-row items-center gap-3">
            <View className="size-11 items-center justify-center rounded-full bg-accent-200">
              <Calendar size={22} color={palette.accent} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-base text-ink">
                Average Cycle Length
              </Text>
              <Text className="font-body text-xs text-tone-600">
                First day of one period to the next
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row items-center justify-between rounded-full bg-canvas p-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease cycle length"
              testID="cycle-length-dec"
              onPress={handleDecCycle}
              className="size-11 items-center justify-center rounded-full bg-canvas active:scale-95"
            >
              <Minus size={20} color={palette.ink} strokeWidth={2.5} />
            </Pressable>

            <View
              className="flex-row items-baseline gap-1"
              testID="cycle-length-value"
            >
              <Text className="font-heading text-3xl text-ink">
                {cycleLength}
              </Text>
              <Text className="font-body text-sm text-tone-600">days</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase cycle length"
              testID="cycle-length-inc"
              onPress={handleIncCycle}
              className="size-11 items-center justify-center rounded-full bg-canvas active:scale-95"
            >
              <Plus size={20} color={palette.ink} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Average Period Duration Card */}
        <View className="rounded-[24px] bg-surface p-5">
          <View className="flex-row items-center gap-3">
            <View className="size-11 items-center justify-center rounded-full bg-accent2-200">
              <Droplet
                size={22}
                color={palette.accent2Scale[700]}
                strokeWidth={2.2}
              />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-base text-ink">
                Average Period Duration
              </Text>
              <Text className="font-body text-xs text-tone-600">
                How many days bleeding usually lasts
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row items-center justify-between rounded-full bg-canvas p-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease period duration"
              testID="period-duration-dec"
              onPress={handleDecPeriod}
              className="size-11 items-center justify-center rounded-full bg-canvas active:scale-95"
            >
              <Minus size={20} color={palette.ink} strokeWidth={2.5} />
            </Pressable>

            <View
              className="flex-row items-baseline gap-1"
              testID="period-duration-value"
            >
              <Text className="font-heading text-3xl text-ink">
                {periodDuration}
              </Text>
              <Text className="font-body text-sm text-tone-600">days</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase period duration"
              testID="period-duration-inc"
              onPress={handleIncPeriod}
              className="size-11 items-center justify-center rounded-full bg-canvas active:scale-95"
            >
              <Plus size={20} color={palette.ink} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

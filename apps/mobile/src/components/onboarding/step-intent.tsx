import { HeartHandshake, User } from 'lucide-react-native';
import React from 'react';
import { TextInput } from 'react-native';

import { Pressable, Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

export type AppIntent = 'myself' | 'partner';

interface StepIntentProps {
  intent: AppIntent | null;
  partnerCode: string;
  onSelectIntent: (intent: AppIntent) => void;
  onChangePartnerCode: (code: string) => void;
}

export function StepIntent({
  intent,
  partnerCode,
  onSelectIntent,
  onChangePartnerCode,
}: StepIntentProps) {
  const palette = usePaletteColors();
  return (
    <View className="flex-1 px-6 pt-4">
      <Text className="font-heading text-[26px] leading-8 text-ink">
        Are you using Happy Women for yourself?
      </Text>
      <Text className="mt-2 font-body text-[15px] leading-6 text-tone-600">
        Choose how you plan to use the app so we can personalize your dashboard.
      </Text>

      <View className="mt-8 gap-4">
        {/* Option A: Yes */}
        <Pressable
          testID="intent-myself"
          onPress={() => onSelectIntent('myself')}
          className={`flex-row items-center rounded-[24px] border p-5 active:opacity-85 ${
            intent === 'myself'
              ? 'border-accent bg-surface'
              : 'border-divider bg-surface'
          }`}
        >
          <View
            className={`size-14 items-center justify-center rounded-full ${
              intent === 'myself' ? 'bg-accent-200' : 'bg-canvas'
            }`}
          >
            <User
              size={26}
              color={intent === 'myself' ? palette.accent : palette.tone[600]}
            />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-body-bold text-[17px] text-ink">
              Yes, for myself
            </Text>
            <Text className="mt-0.5 font-body text-[13px] text-tone-600">
              Track my cycle, pregnancy & intimate wellness
            </Text>
          </View>
          <View
            className={`size-6 items-center justify-center rounded-full border-2 ${
              intent === 'myself' ? 'border-accent bg-accent' : 'border-divider'
            }`}
          >
            {intent === 'myself' && (
              <View className="size-2.5 rounded-full bg-white" />
            )}
          </View>
        </Pressable>

        {/* Option B: No, partner code */}
        <Pressable
          testID="intent-partner"
          onPress={() => onSelectIntent('partner')}
          className={`flex-row items-center rounded-[24px] border p-5 active:opacity-85 ${
            intent === 'partner'
              ? 'border-accent bg-surface'
              : 'border-divider bg-surface'
          }`}
        >
          <View
            className={`size-14 items-center justify-center rounded-full ${
              intent === 'partner' ? 'bg-accent2-200' : 'bg-canvas'
            }`}
          >
            <HeartHandshake
              size={26}
              color={
                intent === 'partner'
                  ? palette.accent2Scale[700]
                  : palette.tone[600]
              }
            />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-body-bold text-[17px] text-ink">
              No, I have a partner code
            </Text>
            <Text className="mt-0.5 font-body text-[13px] text-tone-600">
              Sync and view shared cycle updates & milestones
            </Text>
          </View>
          <View
            className={`size-6 items-center justify-center rounded-full border-2 ${
              intent === 'partner'
                ? 'border-accent bg-accent'
                : 'border-divider'
            }`}
          >
            {intent === 'partner' && (
              <View className="size-2.5 rounded-full bg-white" />
            )}
          </View>
        </Pressable>

        {/* Partner code input when selected */}
        {intent === 'partner' && (
          <View className="rounded-[24px] border border-accent2-300 bg-surface p-5">
            <Text className="font-body-bold text-[14px] text-ink">
              Enter Partner Sync Code
            </Text>
            <TextInput
              value={partnerCode}
              onChangeText={onChangePartnerCode}
              placeholder="e.g. HW-7294"
              placeholderTextColor={palette.tone[500]}
              autoCapitalize="characters"
              testID="partner-code-input"
              className="mt-3 h-12 rounded-full border border-divider bg-canvas px-4 font-mono text-[16px] text-ink"
            />
          </View>
        )}
      </View>
    </View>
  );
}

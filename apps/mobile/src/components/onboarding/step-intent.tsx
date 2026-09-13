import { HeartHandshake, User } from 'lucide-react-native';
import React from 'react';
import { TextInput } from 'react-native';

import { Pressable, Text, View } from '@/components/ui';

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
  return (
    <View className="flex-1 px-6 pt-4">
      <Text className="font-heading text-[26px] leading-8 text-[#4A4A4A]">
        Are you using Happy Women for yourself?
      </Text>
      <Text className="mt-2 font-body text-[15px] leading-6 text-[#8C8C8C]">
        Choose how you plan to use the app so we can personalize your dashboard.
      </Text>

      <View className="mt-8 gap-4">
        {/* Option A: Yes */}
        <Pressable
          testID="intent-myself"
          onPress={() => onSelectIntent('myself')}
          className={`flex-row items-center p-5 rounded-[24px] border active:opacity-85 ${
            intent === 'myself'
              ? 'border-[#FF9FA8] bg-white'
              : 'border-[#F0E5E1] bg-white/90'
          }`}
          style={{
            shadowColor: intent === 'myself' ? '#FF9FA8' : '#F0E5E1',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: intent === 'myself' ? 0.3 : 0.6,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <View
            className={`size-14 rounded-full items-center justify-center ${
              intent === 'myself' ? 'bg-[#FFD6DA]' : 'bg-[#FCF8F5]'
            }`}
          >
            <User size={26} color={intent === 'myself' ? '#FF9FA8' : '#8C8C8C'} />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-body-bold text-[17px] text-[#4A4A4A]">
              Yes, for myself
            </Text>
            <Text className="mt-0.5 font-body text-[13px] text-[#8C8C8C]">
              Track my cycle, pregnancy & intimate wellness
            </Text>
          </View>
          <View
            className={`size-6 rounded-full border-2 items-center justify-center ${
              intent === 'myself'
                ? 'border-[#FF9FA8] bg-[#FF9FA8]'
                : 'border-[#F0E5E1]'
            }`}
          >
            {intent === 'myself' && <View className="size-2.5 rounded-full bg-white" />}
          </View>
        </Pressable>

        {/* Option B: No, partner code */}
        <Pressable
          testID="intent-partner"
          onPress={() => onSelectIntent('partner')}
          className={`flex-row items-center p-5 rounded-[24px] border active:opacity-85 ${
            intent === 'partner'
              ? 'border-[#FF9FA8] bg-white'
              : 'border-[#F0E5E1] bg-white/90'
          }`}
          style={{
            shadowColor: intent === 'partner' ? '#FF9FA8' : '#F0E5E1',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: intent === 'partner' ? 0.3 : 0.6,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <View
            className={`size-14 rounded-full items-center justify-center ${
              intent === 'partner' ? 'bg-[#DCEBFC]' : 'bg-[#FCF8F5]'
            }`}
          >
            <HeartHandshake
              size={26}
              color={intent === 'partner' ? '#7EACDF' : '#8C8C8C'}
            />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-body-bold text-[17px] text-[#4A4A4A]">
              No, I have a partner code
            </Text>
            <Text className="mt-0.5 font-body text-[13px] text-[#8C8C8C]">
              Sync and view shared cycle updates & milestones
            </Text>
          </View>
          <View
            className={`size-6 rounded-full border-2 items-center justify-center ${
              intent === 'partner'
                ? 'border-[#FF9FA8] bg-[#FF9FA8]'
                : 'border-[#F0E5E1]'
            }`}
          >
            {intent === 'partner' && <View className="size-2.5 rounded-full bg-white" />}
          </View>
        </Pressable>

        {/* Partner code input when selected */}
        {intent === 'partner' && (
          <View
            className="p-5 rounded-[24px] bg-white border border-[#B5D3F8]"
            style={{
              shadowColor: '#B5D3F8',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <Text className="font-body-bold text-[14px] text-[#4A4A4A]">
              Enter Partner Sync Code
            </Text>
            <TextInput
              value={partnerCode}
              onChangeText={onChangePartnerCode}
              placeholder="e.g. HW-7294"
              placeholderTextColor="#AFAFAF"
              autoCapitalize="characters"
              testID="partner-code-input"
              className="mt-3 h-12 rounded-full border border-[#F0E5E1] bg-[#FCF8F5] px-4 font-mono text-[16px] text-[#4A4A4A]"
            />
          </View>
        )}
      </View>
    </View>
  );
}

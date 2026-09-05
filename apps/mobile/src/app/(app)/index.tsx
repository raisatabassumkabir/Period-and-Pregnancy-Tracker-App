import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import React from 'react';

import { useMe } from '@/api/auth';
import { usePaymentSubscriptionStatus } from '@/api/billing/use-subscription-status';
import { PremiumBadge } from '@/components/billing';
import {
  FocusAwareStatusBar,
  Kicker,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 17;
const AVATAR_FALLBACK_ICON_SIZE = 20;
const SETTINGS_ROUTE = '/(app)/settings';

function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < MORNING_END_HOUR) return 'Good morning';
  if (hour < AFTERNOON_END_HOUR) return 'Good afternoon';
  return 'Good evening';
}

function AvatarButton({ fullName }: { fullName: string | null | undefined }) {
  const router = useRouter();
  const palette = usePaletteColors();

  return (
    <Pressable
      accessibilityRole="button"
      testID="settings-avatar"
      onPress={() => router.push(SETTINGS_ROUTE)}
      className="size-[46px] items-center justify-center rounded-full bg-tone-200"
    >
      {fullName ? (
        <Text className="font-body-bold text-lg text-ink">
          {fullName.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <User size={AVATAR_FALLBACK_ICON_SIZE} color={palette.tone[700]} />
      )}
    </Pressable>
  );
}

function HomeHeader() {
  const { data: user } = useMe();
  const { data: subscription } = usePaymentSubscriptionStatus({
    refetchOnWindowFocus: true,
  });

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const isPremium = subscription?.is_premium ?? false;

  return (
    <View className="flex-row items-start justify-between">
      <View>
        <Text className="font-body-semibold text-[13px] text-tone-600">
          {getGreeting()}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="font-heading text-[26px] text-ink">{firstName}</Text>
          {isPremium && <PremiumBadge compact />}
        </View>
      </View>
      <AvatarButton fullName={user?.full_name} />
    </View>
  );
}

/** Starter home screen. Replace the placeholder card with the app's real dashboard. */
export default function Home() {
  return (
    <View className="flex-1 bg-canvas" testID="home-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-3">
          <HomeHeader />
        </View>
      </SafeAreaView>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-8 pt-6"
      >
        <Kicker>Get started</Kicker>
        <View className="mt-2 rounded-card bg-surface p-5">
          <Text className="font-heading text-[20px] text-ink">
            Your first screen
          </Text>
          <Text className="mt-2 text-[15px] leading-6 text-tone-700">
            Auth, theming, i18n, billing and the 402 upgrade sheet are wired.
            Build the product from here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

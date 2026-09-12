import { useRouter } from 'expo-router';
import { Bell, User } from 'lucide-react-native';
import React from 'react';

import { useMe } from '@/api/auth';
import { usePaymentSubscriptionStatus } from '@/api/billing/use-subscription-status';
import { PremiumBadge } from '@/components/billing';
import { Pressable, Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';
import { usePersonalizationProfile } from '@/lib/health/use-personalization-profile';

const AVATAR_ICON_SIZE = 20;
const BELL_ICON_SIZE = 22;
const SETTINGS_ROUTE = '/(app)/settings';

function AvatarButton({ fullName }: { fullName: string | null | undefined }) {
  const router = useRouter();
  const palette = usePaletteColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      testID="settings-avatar"
      onPress={() => router.push(SETTINGS_ROUTE)}
      className="size-[42px] items-center justify-center rounded-full bg-accent-100 border border-accent/10 shadow-sm active:opacity-80"
    >
      {fullName ? (
        <Text className="font-heading text-lg text-accent-700">
          {fullName.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <User size={AVATAR_ICON_SIZE} color={palette.accentScale[700]} />
      )}
    </Pressable>
  );
}

export function AppHeader({ title }: { title?: string }) {
  const { data: user } = useMe();
  const { profile } = usePersonalizationProfile();
  const { data: subscription } = usePaymentSubscriptionStatus({
    refetchOnWindowFocus: true,
  });
  const palette = usePaletteColors();

  const isPremium = subscription?.is_premium ?? false;
  const displayName = profile.fullName || user?.full_name || 'there';
  const firstName = displayName.split(' ')[0];

  return (
    <View className="flex-row items-center justify-between pb-3 pt-2">
      <View className="flex-row items-center gap-3">
        <AvatarButton fullName={displayName} />
        <View className="justify-center">
          <Text className="font-body-bold text-[12px] uppercase tracking-widest text-accent">
            {title ? title.toUpperCase() : 'WELCOME BACK'}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <Text className="font-heading text-[22px] tracking-wide text-ink">
              Hi, {firstName}
            </Text>
            {isPremium && <PremiumBadge compact />}
          </View>
        </View>
      </View>
      <Pressable
        className="size-[42px] items-center justify-center rounded-full bg-surface shadow-sm active:opacity-80"
        testID="notifications-bell"
        accessibilityLabel="Notifications"
      >
        <Bell size={BELL_ICON_SIZE} color={palette.ink} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator } from 'react-native';

import { useMe } from '@/api/auth';
import { usePaymentSubscriptionStatus } from '@/api/billing/use-subscription-status';
import { Pill, Pressable, Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib';

const LOGIN_ROUTE = '/login';

function Avatar({ initial }: { initial: string }) {
  return (
    <View className="size-[58px] items-center justify-center rounded-full bg-accent">
      <Text className="font-heading text-[24px] text-accent-100">
        {initial}
      </Text>
    </View>
  );
}

/** Signed-out fallback — the card doubles as the way back into the app. */
function SignedOut() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      testID="profile-header-login"
      onPress={() => router.push(LOGIN_ROUTE)}
      className="flex-row items-center gap-4 rounded-card bg-surface p-4 active:opacity-80"
    >
      <Avatar initial="?" />
      <View className="flex-1">
        <Text className="font-heading text-[19px] text-ink">Log in</Text>
        <Text className="mt-0.5 text-[13px] text-tone-700">Tap to sign in</Text>
      </View>
    </Pressable>
  );
}

export const ProfileHeader = () => {
  const { data: user, isLoading: isLoadingUser } = useMe();
  const { data: subscription } = usePaymentSubscriptionStatus();
  const colors = usePaletteColors();

  if (isLoadingUser) {
    return (
      <View
        testID="profile-header-loading"
        className="items-center rounded-card bg-surface p-6"
      >
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (!user) return <SignedOut />;

  const isPremium = subscription?.is_premium ?? false;

  return (
    <View
      testID="profile-header"
      className="flex-row items-center gap-4 rounded-card bg-surface p-4"
    >
      <Avatar
        initial={
          user.full_name?.charAt(0).toUpperCase() ||
          user.email?.charAt(0).toUpperCase() ||
          '?'
        }
      />
      <View className="flex-1">
        <Text className="font-heading text-[19px] text-ink" numberOfLines={1}>
          {user.full_name || 'User'}
        </Text>
        <Text className="mt-0.5 text-[13px] text-tone-700" numberOfLines={1}>
          {user.email}
        </Text>
        <View className="mt-2 flex-row">
          <Pill
            label={isPremium ? 'Premium plan' : 'Free plan'}
            tone={isPremium ? 'accent-soft' : 'neutral'}
            strong={isPremium}
          >
            <View
              className={`size-[7px] rounded-full ${
                isPremium ? 'bg-accent' : 'bg-accent2-600'
              }`}
            />
          </Pill>
        </View>
      </View>
    </View>
  );
};

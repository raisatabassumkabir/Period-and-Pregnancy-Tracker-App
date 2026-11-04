import { useRouter } from 'expo-router';
import { Bell, User } from 'lucide-react-native';
import React from 'react';

import { useMe } from '@/api/auth';
import { usePaymentSubscriptionStatus } from '@/api/billing/use-subscription-status';
import { PremiumBadge } from '@/components/billing';
import { RemindersSheet } from '@/components/reminders';
import { Pressable, Text, View } from '@/components/ui';
import { usePersonalizationProfile } from '@/lib/health/use-personalization-profile';
import { usePartnerAccount } from '@/lib/partner/use-partner-account';
import { useReminderSettings } from '@/lib/reminders';
import { usePaletteColors } from '@/lib/theme';

const AVATAR_ICON_SIZE = 20;
const BELL_ICON_SIZE = 22;
const SETTINGS_ROUTE = '/(app)/settings';
const AFTERNOON_HOUR = 12;
const EVENING_HOUR = 18;

/** "Good morning," by the phone's clock: the kicker over her name on Home. */
export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < AFTERNOON_HOUR) return 'Good morning,';
  if (hour < EVENING_HOUR) return 'Good afternoon,';
  return 'Good evening,';
}

function AvatarButton({ fullName }: { fullName: string | null | undefined }) {
  const router = useRouter();
  const palette = usePaletteColors();
  const partnerAccount = usePartnerAccount();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      testID="settings-avatar"
      onPress={() => router.push(SETTINGS_ROUTE)}
      className={`size-12 items-center justify-center rounded-full active:opacity-80 ${
        partnerAccount ? 'bg-accent2-200' : 'bg-accent-200'
      }`}
    >
      {fullName ? (
        <Text
          className={`font-display text-[20px] ${partnerAccount ? 'text-accent2-700' : 'text-accent-700'}`}
        >
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

  const isPremium = subscription?.is_premium ?? false;
  const displayName = profile.fullName || user?.full_name || 'there';
  const firstName = displayName.split(' ')[0];

  return (
    <View className="flex-row items-center justify-between pb-3 pt-2">
      <View className="flex-row items-center gap-3">
        <AvatarButton fullName={displayName} />
        <View className="justify-center">
          <Text
            className="font-body-bold text-[14px] text-tone-600"
            testID="app-header-kicker"
          >
            {title ?? greetingFor(new Date())}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text
              className="font-display text-[26px] leading-[32px] text-ink"
              testID="app-header-name"
            >
              {firstName}
            </Text>
            {isPremium && <PremiumBadge compact />}
          </View>
        </View>
      </View>
      <ReminderBell />
    </View>
  );
}

/** Opens period reminders; a dot on the bell means reminders are on. */
function ReminderBell() {
  const palette = usePaletteColors();
  const partnerAccount = usePartnerAccount();
  const [isOpen, setIsOpen] = React.useState(false);
  const enabled = useReminderSettings((state) => state.settings.enabled);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          enabled ? 'Period reminders, on' : 'Period reminders, off'
        }
        onPress={() => setIsOpen(true)}
        className={`size-12 items-center justify-center rounded-full border-2 bg-surface active:opacity-80 ${
          partnerAccount ? 'border-accent2-200' : 'border-divider'
        }`}
        testID="notifications-bell"
      >
        <Bell size={BELL_ICON_SIZE} color={palette.ink} strokeWidth={2} />
        {enabled ? (
          <View
            className="absolute right-2.5 top-2.5 size-2.5 rounded-full border-2 border-surface bg-accent"
            testID="notifications-bell-dot"
          />
        ) : null}
      </Pressable>
      <RemindersSheet visible={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

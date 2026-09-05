import { Crown, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator } from 'react-native';

import { usePaymentSubscriptionStatus } from '@/api/billing/use-subscription-status';
import { Pressable, Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib';
import { showUpgrade } from '@/lib/upgrade';

import { PremiumBadge } from './premium-badge';

const ICON_SIZE = 20;

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  cancelled: 'Cancels at period end',
  expired: 'Expired',
  free: 'Free plan',
};

/** The upsell face of the card — Organic's accent-filled call to action. */
function UpgradePrompt() {
  const colors = usePaletteColors();

  return (
    <Pressable
      testID="subscription-card-upgrade"
      accessibilityRole="button"
      onPress={() =>
        showUpgrade({
          message: 'Upgrade to unlock every premium feature.',
          feature: 'premium',
        })
      }
      className="mt-4 flex-row items-center gap-3 rounded-card bg-accent p-4 active:opacity-90"
    >
      <View className="size-11 items-center justify-center rounded-panel bg-accent-700">
        <Sparkles size={ICON_SIZE} color={colors.accentScale[100]} />
      </View>
      <View className="flex-1">
        <Text className="font-heading text-[18px] text-accent-100">
          Get Premium
        </Text>
        <Text className="mt-0.5 text-[13px] text-accent-200">
          Unlock every premium feature
        </Text>
      </View>
    </Pressable>
  );
}

export const SubscriptionCard = () => {
  const { data, isLoading } = usePaymentSubscriptionStatus({
    refetchOnWindowFocus: true,
  });
  const colors = usePaletteColors();

  if (isLoading) {
    return (
      <View
        testID="subscription-card-loading"
        className="mt-4 items-center rounded-card bg-surface p-6"
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!(data?.is_premium ?? false)) return <UpgradePrompt />;

  const endsAt = formatDate(data?.subscription_ends_at ?? null);
  const status = data?.subscription_status ?? 'free';

  return (
    <View
      testID="subscription-card-premium"
      className="mt-4 rounded-card bg-accent2-800 p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-11 items-center justify-center rounded-panel bg-accent2-700">
            <Crown size={ICON_SIZE} color={colors.accent2Scale[100]} />
          </View>
          <View className="flex-1">
            <Text className="font-heading text-[18px] text-accent2-100">
              Premium Member
            </Text>
            <Text className="mt-0.5 text-[13px] text-accent2-300">
              {STATUS_LABEL[status] ?? status}
            </Text>
          </View>
        </View>
        <PremiumBadge compact />
      </View>
      {endsAt && (
        <Text className="mt-3 text-xs text-accent2-300">
          {status === 'cancelled' ? 'Premium until ' : 'Renews on '}
          {endsAt}
        </Text>
      )}
    </View>
  );
};

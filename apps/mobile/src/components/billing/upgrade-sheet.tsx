import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { UpgradeRequiredDetail } from '@/api/billing/types';
import { colors as legacyColors, Modal, Text } from '@/components/ui';
import { useOfferings } from '@/lib/billing/use-offerings';
import { usePurchasePremium } from '@/lib/billing/use-purchase-premium';
import { openPrivacyPolicy, openTerms } from '@/lib/external-links';
import { usePaletteColors } from '@/lib/theme';
import { useUpgrade } from '@/lib/upgrade';

const DANGER_ICON_COLOR = legacyColors.danger[600];
const HERO_ICON_SIZE = 26;
const CHECK_ICON_SIZE = 14;
const SUCCESS_ICON_SIZE = 32;
const ALERT_ICON_SIZE = 18;
const CLOSE_ICON_SIZE = 18;

const FEATURE_HIGHLIGHTS: { icon: string; label: string }[] = [
  { icon: 'check', label: 'Advanced cycle & symptom analytics' },
  { icon: 'check', label: 'Personalized cycle & ovulation forecasts' },
  { icon: 'check', label: 'Full trimester meal & nutrition plans' },
  { icon: 'check', label: 'AI Health Guide with deeper insights' },
];

const FEATURE_TITLES: Record<string, string> = {
  premium: 'Upgrade to Premium',
};

function getTitle(detail: UpgradeRequiredDetail | null): string {
  if (!detail) return FEATURE_TITLES.premium;
  return FEATURE_TITLES[detail.feature] ?? FEATURE_TITLES.premium;
}

const SparkleIcon = () => {
  const colors = usePaletteColors();
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      120,
      withSequence(
        withTiming(1.15, {
          duration: 360,
          easing: Easing.out(Easing.back(1.5)),
        }),
        withTiming(1, { duration: 200 })
      )
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [rotate, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotateZ: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      style={style}
      className="size-14 items-center justify-center rounded-full bg-accent"
    >
      <Sparkles size={HERO_ICON_SIZE} color={colors.accentScale[100]} />
    </Animated.View>
  );
};

interface FeatureRowProps {
  label: string;
  delay: number;
}

const FeatureRow = ({ label, delay }: FeatureRowProps) => {
  const colors = usePaletteColors();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
    translateX.value = withDelay(
      delay,
      withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, opacity, translateX]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={style} className="flex-row items-center py-1.5">
      <View className="mr-3 size-5 items-center justify-center rounded-full bg-accent2-200">
        <Check size={CHECK_ICON_SIZE} color={colors.accent2Scale[800]} />
      </View>
      <Text className="flex-1 text-[14px] text-ink">{label}</Text>
    </Animated.View>
  );
};

interface PlanOptionCardProps {
  label: string;
  priceString: string;
  periodText: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  testID: string;
}

const PlanOptionCard = ({
  label,
  priceString,
  periodText,
  badge,
  selected,
  onSelect,
  disabled,
  testID,
}: PlanOptionCardProps) => {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={disabled}
      onPress={onSelect}
      className={`relative flex-1 rounded-card border-2 p-3.5 ${
        selected ? 'border-accent bg-accent/10' : 'border-divider bg-surface'
      } ${disabled ? 'opacity-50' : 'active:opacity-85'}`}
    >
      {!!badge && (
        <View className="absolute -top-2.5 right-3 rounded-full bg-accent px-2 py-0.5">
          <Text className="font-body-bold text-[10px] uppercase text-accent-100">
            {badge}
          </Text>
        </View>
      )}
      <Text className="font-heading text-[16px] text-ink">{label}</Text>
      <Text className="mt-1 font-heading text-[18px] text-accent">
        {priceString}
      </Text>
      <Text className="mt-0.5 text-xs text-tone-600">{periodText}</Text>
    </Pressable>
  );
};

interface CtaButtonProps {
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  label: string;
  testID?: string;
}

const CtaButton = ({
  loading,
  disabled,
  onPress,
  label,
  testID,
}: CtaButtonProps) => {
  const colors = usePaletteColors();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled || loading}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 80 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 120 });
        }}
        onPress={onPress}
        className={`h-13 mt-4 flex-row items-center justify-center rounded-card ${
          disabled ? 'bg-tone-300' : 'bg-accent'
        }`}
      >
        {loading ? (
          <ActivityIndicator color={colors.accentScale[100]} />
        ) : (
          <Text
            className={`font-body-bold text-[15px] ${
              disabled ? 'text-tone-600' : 'text-accent-100'
            }`}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

interface SuccessStateProps {
  onClose: () => void;
}

const SuccessState = ({ onClose }: SuccessStateProps) => {
  const colors = usePaletteColors();
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.15, { duration: 280, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 160 })
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="items-center pb-8 pt-4" testID="upgrade-sheet-success">
      <Animated.View
        style={style}
        className="mb-4 size-16 items-center justify-center rounded-full bg-accent2-200"
      >
        <CheckCircle2
          size={SUCCESS_ICON_SIZE}
          color={colors.accent2Scale[800]}
        />
      </Animated.View>
      <Text className="text-center font-heading text-[26px] text-ink">
        You&apos;re Premium!
      </Text>
      <Text className="mt-2 text-center text-[15px] text-tone-700">
        All features have been unlocked. Enjoy!
      </Text>
      <CtaButton
        loading={false}
        disabled={false}
        onPress={onClose}
        label="Done"
        testID="upgrade-sheet-done"
      />
    </View>
  );
};

interface ErrorBannerProps {
  message: string;
}

const ErrorBanner = ({ message }: ErrorBannerProps) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 240 });
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={style}
      className="mt-3 flex-row items-start rounded-panel bg-danger-50 p-3"
      testID="upgrade-sheet-error"
    >
      <AlertCircle size={ALERT_ICON_SIZE} color={DANGER_ICON_COLOR} />
      <Text className="ml-2 flex-1 text-sm text-danger-700">{message}</Text>
    </Animated.View>
  );
};

const LegalLinks = () => {
  return (
    <View className="mt-3 flex-row items-center justify-center gap-2">
      <Pressable
        testID="upgrade-sheet-terms"
        accessibilityRole="link"
        accessibilityLabel="Terms of Service"
        onPress={() => void openTerms()}
      >
        <Text className="text-xs text-tone-600 underline">
          Terms of Service
        </Text>
      </Pressable>
      <Text className="text-xs text-tone-500">•</Text>
      <Pressable
        testID="upgrade-sheet-privacy"
        accessibilityRole="link"
        accessibilityLabel="Privacy Policy"
        onPress={() => void openPrivacyPolicy()}
      >
        <Text className="text-xs text-tone-600 underline">Privacy Policy</Text>
      </Pressable>
    </View>
  );
};

interface UpgradeSheetHeaderProps {
  title: string;
  message?: string;
  onClose: () => void;
}

const UpgradeSheetHeader = ({
  title,
  message,
  onClose,
}: UpgradeSheetHeaderProps) => {
  const colors = usePaletteColors();
  return (
    <>
      <View className="mb-2 flex-row items-center justify-between">
        <View className="size-8" />
        <SparkleIcon />
        <Pressable
          testID="upgrade-sheet-close"
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="size-8 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <X size={CLOSE_ICON_SIZE} color={colors.ink} />
        </Pressable>
      </View>
      <Text
        testID="upgrade-sheet-title"
        className="text-center font-heading text-[24px] text-ink"
      >
        {title}
      </Text>
      {!!message && (
        <Text
          testID="upgrade-sheet-message"
          className="mt-1.5 text-center text-[14px] text-tone-700"
        >
          {message}
        </Text>
      )}
      <View className="mt-3.5">
        {FEATURE_HIGHLIGHTS.map((f, idx) => (
          <FeatureRow key={f.label} label={f.label} delay={120 + idx * 80} />
        ))}
      </View>
    </>
  );
};

/**
 * Calculates annual percentage savings from real numerical store prices.
 * Returns undefined if either price is invalid or comparison does not yield positive savings.
 */
export function calculateAnnualSavingsBadge(
  annualPackage?: PurchasesPackage | null,
  monthlyPackage?: PurchasesPackage | null
): string | undefined {
  const annualPrice = annualPackage?.product?.price;
  const monthlyPrice = monthlyPackage?.product?.price;

  if (
    typeof annualPrice !== 'number' ||
    typeof monthlyPrice !== 'number' ||
    !Number.isFinite(annualPrice) ||
    !Number.isFinite(monthlyPrice) ||
    annualPrice <= 0 ||
    monthlyPrice <= 0
  ) {
    return undefined;
  }

  const annualizedMonthly = monthlyPrice * 12;
  if (annualPrice >= annualizedMonthly) {
    return undefined;
  }

  const savingsPercent = Math.round(
    ((annualizedMonthly - annualPrice) / annualizedMonthly) * 100
  );
  return savingsPercent > 0 ? `Save ~${savingsPercent}%` : undefined;
}

interface PlanSelectorProps {
  annualPackage: ReturnType<typeof useOfferings>['annualPackage'];
  monthlyPackage: ReturnType<typeof useOfferings>['monthlyPackage'];
  selectedPlan: 'annual' | 'monthly';
  onSelectPlan: (plan: 'annual' | 'monthly') => void;
  isLoadingOfferings: boolean;
}

const UpgradeSheetPlanSelector = ({
  annualPackage,
  monthlyPackage,
  selectedPlan,
  onSelectPlan,
  isLoadingOfferings,
}: PlanSelectorProps) => {
  const hasOfferings = Boolean(annualPackage || monthlyPackage);
  const annualSavingsBadge = calculateAnnualSavingsBadge(
    annualPackage,
    monthlyPackage
  );

  if (hasOfferings) {
    return (
      <View className="mt-4 flex-row gap-3">
        <PlanOptionCard
          testID="upgrade-sheet-option-annual"
          label="Annual"
          badge={annualSavingsBadge}
          priceString={annualPackage?.product.priceString ?? '—'}
          periodText="Billed annually"
          selected={selectedPlan === 'annual'}
          disabled={!annualPackage}
          onSelect={() => onSelectPlan('annual')}
        />
        <PlanOptionCard
          testID="upgrade-sheet-option-monthly"
          label="Monthly"
          priceString={monthlyPackage?.product.priceString ?? '—'}
          periodText="Billed monthly"
          selected={selectedPlan === 'monthly'}
          disabled={!monthlyPackage}
          onSelect={() => onSelectPlan('monthly')}
        />
      </View>
    );
  }
  if (!isLoadingOfferings) {
    return (
      <View
        className="mt-4 rounded-card bg-surface p-3.5"
        testID="upgrade-sheet-unavailable"
      >
        <Text className="text-center text-xs text-tone-600">
          Subscriptions are currently unavailable. Please check your connection
          or try again later.
        </Text>
      </View>
    );
  }
  return null;
};

interface UpgradeSheetBodyProps {
  purchase: ReturnType<typeof usePurchasePremium>;
  monthlyPackage: ReturnType<typeof useOfferings>['monthlyPackage'];
  annualPackage: ReturnType<typeof useOfferings>['annualPackage'];
  isLoadingOfferings: boolean;
  detail: ReturnType<typeof useUpgrade.use.detail>;
  title: string;
  isLoading: boolean;
  onClose: () => void;
  onBuy: (pkg: any) => void;
  onRestore: () => void;
}

const UpgradeSheetBody = ({
  purchase,
  monthlyPackage,
  annualPackage,
  isLoadingOfferings,
  detail,
  title,
  isLoading,
  onClose,
  onBuy,
  onRestore,
}: UpgradeSheetBodyProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>(
    'annual'
  );

  if (purchase.status === 'success' && purchase.result?.is_premium) {
    return <SuccessState onClose={onClose} />;
  }

  const selectedPackage =
    selectedPlan === 'annual'
      ? (annualPackage ?? monthlyPackage)
      : (monthlyPackage ?? annualPackage);

  const ctaLabel = selectedPackage?.product.priceString
    ? `Subscribe (${selectedPackage.product.priceString}/${
        selectedPlan === 'annual' ? 'yr' : 'mo'
      })`
    : annualPackage || monthlyPackage
      ? 'Upgrade to Premium'
      : 'Subscription Unavailable';

  const renewalDisclosure = selectedPackage?.product.priceString
    ? `Billed via Google Play. Auto-renews at ${
        selectedPackage.product.priceString
      }/${
        selectedPlan === 'annual' ? 'year' : 'month'
      } until cancelled. Cancel anytime in Google Play Store.`
    : 'Billed via Google Play. Cancel anytime in Google Play Store settings.';

  return (
    <>
      <UpgradeSheetHeader
        title={title}
        message={detail?.message}
        onClose={onClose}
      />

      <UpgradeSheetPlanSelector
        annualPackage={annualPackage}
        monthlyPackage={monthlyPackage}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        isLoadingOfferings={isLoadingOfferings}
      />

      {purchase.status === 'pending_sync' ? (
        <CtaButton
          testID="upgrade-sheet-retry-cta"
          loading={isLoading}
          disabled={isLoading}
          onPress={() => purchase.retrySync()}
          label="Retry Verification"
        />
      ) : (
        <CtaButton
          testID="upgrade-sheet-cta"
          loading={isLoading}
          disabled={isLoading || !selectedPackage}
          onPress={() => onBuy(selectedPackage)}
          label={ctaLabel}
        />
      )}

      <View className="mt-2.5 flex-row items-center justify-center gap-4">
        <Pressable
          testID="upgrade-sheet-restore"
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
          disabled={isLoading}
          onPress={onRestore}
          className="py-1"
        >
          <Text className="font-body-bold text-xs text-tone-700 underline">
            Restore purchases
          </Text>
        </Pressable>
        <Text className="text-xs text-tone-500">•</Text>
        <Pressable
          testID="upgrade-sheet-dismiss"
          accessibilityRole="button"
          accessibilityLabel="Continue with free version"
          disabled={isLoading}
          onPress={onClose}
          className="py-1"
        >
          <Text className="font-body text-xs text-tone-600">
            Continue with Free
          </Text>
        </Pressable>
      </View>

      {(purchase.status === 'error' || purchase.status === 'pending_sync') &&
        purchase.error && <ErrorBanner message={purchase.error.message} />}

      <Text className="mt-2.5 text-center text-[11px] leading-4 text-tone-600">
        {renewalDisclosure}
      </Text>

      <LegalLinks />
    </>
  );
};

export const UpgradeSheet = () => {
  const ref = useRef<BottomSheetModal>(null);
  const visible = useUpgrade.use.visible();
  const detail = useUpgrade.use.detail();
  const hide = useUpgrade.use.hide();
  const colors = usePaletteColors();
  const purchase = usePurchasePremium();
  const {
    monthlyPackage,
    annualPackage,
    isLoading: isLoadingOfferings,
  } = useOfferings();

  const snapPoints = useMemo(() => ['86%'], []);
  const title = getTitle(detail);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    if (visible) hide();
    if (purchase.status === 'success') {
      purchase.reset();
    }
  };

  const handleClose = () => {
    purchase.reset();
    hide();
  };

  const handleBuy = async (pkg: any) => {
    await purchase.buy(pkg ?? undefined);
  };

  const handleRestore = async () => {
    await purchase.restore();
  };

  const isLoading =
    purchase.status === 'opening' ||
    purchase.status === 'verifying' ||
    purchase.status === 'acknowledging';

  return (
    <Modal
      ref={ref}
      snapPoints={snapPoints}
      onDismiss={handleDismiss}
      backgroundStyle={{ backgroundColor: colors.canvas }}
    >
      <View className="px-5 pb-6" testID="upgrade-sheet">
        <UpgradeSheetBody
          purchase={purchase}
          monthlyPackage={monthlyPackage}
          annualPackage={annualPackage}
          isLoadingOfferings={isLoadingOfferings}
          detail={detail}
          title={title}
          isLoading={isLoading}
          onClose={handleClose}
          onBuy={handleBuy}
          onRestore={handleRestore}
        />
      </View>
    </Modal>
  );
};

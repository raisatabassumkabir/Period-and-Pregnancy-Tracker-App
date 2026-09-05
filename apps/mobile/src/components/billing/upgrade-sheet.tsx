import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
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
import { usePurchasePremium } from '@/lib/billing/use-purchase-premium';
import { usePaletteColors } from '@/lib/theme';
import { useUpgrade } from '@/lib/upgrade';

/** Destructive red stays fixed across palettes — it is a signal, not a theme. */
const DANGER_ICON_COLOR = legacyColors.danger[600];

const HERO_ICON_SIZE = 28;
const CHECK_ICON_SIZE = 14;
const SUCCESS_ICON_SIZE = 32;
const ALERT_ICON_SIZE = 18;

/** Marketing bullets. Replace per app; never put quota numbers here (the 402 body owns them). */
const FEATURE_HIGHLIGHTS: { icon: string; label: string }[] = [
  { icon: 'check', label: 'Unlimited access to every feature' },
  { icon: 'check', label: 'Priority support' },
  { icon: 'check', label: 'Cancel anytime' },
];

/** One title per `PremiumFeature`; unknown keys fall back to `premium`. */
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
      className="mb-4 size-16 items-center justify-center self-center rounded-full bg-accent"
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
    <Animated.View style={style} className="flex-row items-center py-2">
      <View className="mr-3 size-6 items-center justify-center rounded-full bg-accent2-200">
        <Check size={CHECK_ICON_SIZE} color={colors.accent2Scale[800]} />
      </View>
      <Text className="flex-1 text-[15px] text-ink">{label}</Text>
    </Animated.View>
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
        className={`mt-5 h-14 flex-row items-center justify-center rounded-card ${
          disabled ? 'bg-tone-300' : 'bg-accent'
        }`}
      >
        {loading ? (
          <ActivityIndicator color={colors.accentScale[100]} />
        ) : (
          <Text
            className={`font-body-bold text-[16px] ${
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

import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

/**
 * Mounted once in the root layout. Observes the upgrade store, which the axios
 * 402 interceptor and explicit "Go premium" buttons feed.
 */
export const UpgradeSheet = () => {
  if (isExpoGo) {
    return null;
  }
  const ref = useRef<BottomSheetModal>(null);
  const visible = useUpgrade.use.visible();
  const detail = useUpgrade.use.detail();
  const hide = useUpgrade.use.hide();
  const colors = usePaletteColors();
  const purchase = usePurchasePremium();

  const snapPoints = useMemo(() => ['72%'], []);
  const title = getTitle(detail);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  // When the sheet is dismissed by the user (drag/backdrop), sync store
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

  const handleBuy = async () => {
    // Success leaves the success state visible; the user taps "Done" to close.
    await purchase.buy();
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
      <View className="px-6 pb-6" testID="upgrade-sheet">
        {purchase.status === 'success' && purchase.result?.is_premium ? (
          <SuccessState onClose={handleClose} />
        ) : (
          <>
            <SparkleIcon />
            <Text
              testID="upgrade-sheet-title"
              className="text-center font-heading text-[26px] text-ink"
            >
              {title}
            </Text>
            {!!detail?.message && (
              <Text
                testID="upgrade-sheet-message"
                className="mt-2 text-center text-[15px] text-tone-700"
              >
                {detail.message}
              </Text>
            )}

            <View className="mt-5">
              {FEATURE_HIGHLIGHTS.map((f, idx) => (
                <FeatureRow
                  key={f.label}
                  label={f.label}
                  delay={120 + idx * 80}
                />
              ))}
            </View>

            <CtaButton
              testID="upgrade-sheet-cta"
              loading={isLoading}
              disabled={isLoading}
              onPress={handleBuy}
              label="Upgrade to Premium"
            />

            {purchase.status === 'error' && purchase.error && (
              <ErrorBanner message={purchase.error.message} />
            )}

            <Text className="mt-3 text-center text-xs text-tone-600">
              Billed via Google Play. Cancel anytime in Play settings.
            </Text>
          </>
        )}
      </View>
    </Modal>
  );
};

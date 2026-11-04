import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import {
  BrandLockup,
  FocusAwareStatusBar,
  Pressable,
  SafeAreaView,
  Squiggle,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft } from '@/components/ui/icons';
import { usePaletteColors } from '@/lib/theme';

const SCROLL_CONTENT = {
  flexGrow: 1,
  paddingHorizontal: 24,
  paddingBottom: 36,
} as const;

interface Props {
  kicker?: string;
  title: string;
  subtitle: string;
  onGoBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
}

export function AuthLayout({
  kicker,
  title,
  subtitle,
  onGoBack,
  children,
  footer,
  testID,
}: Props) {
  const palette = usePaletteColors();

  return (
    <View className="flex-1 bg-surface" testID={testID}>
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="h-12 justify-center px-4">
          {onGoBack !== undefined && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              testID="auth-back"
              onPress={onGoBack}
              className="size-10 items-center justify-center rounded-full border border-divider bg-surface/40 active:opacity-70"
            >
              <ArrowLeft color={palette.ink} />
            </Pressable>
          )}
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={SCROLL_CONTENT}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Lockup */}
            <Animated.View
              entering={FadeInDown.duration(800).springify().damping(16)}
              className="items-center pb-6 pt-2"
            >
              <BrandLockup testID="auth-brand" />
            </Animated.View>

            {/* Title & Subtitle */}
            <Animated.View
              entering={FadeInDown.delay(100)
                .duration(800)
                .springify()
                .damping(16)}
              className="mb-7 items-center px-1"
            >
              {kicker ? (
                <Text className="mb-1 text-center font-body-bold text-[14px] text-accent-700">
                  {kicker}
                </Text>
              ) : null}
              <Text className="text-center font-display text-[32px] leading-[40px] text-ink">
                {title}
              </Text>
              <Squiggle />
              <Text className="mt-2 text-center font-body text-[16px] leading-6 text-tone-600">
                {subtitle}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(200)
                .duration(800)
                .springify()
                .damping(16)}
              testID="auth-form-card"
            >
              {children}
            </Animated.View>

            {footer ? (
              <Animated.View
                entering={FadeInUp.delay(300)
                  .duration(800)
                  .springify()
                  .damping(16)}
                className="mt-7"
              >
                {footer}
              </Animated.View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

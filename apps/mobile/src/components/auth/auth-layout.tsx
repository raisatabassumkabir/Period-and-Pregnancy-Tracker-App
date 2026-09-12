import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import {
  BrandLockup,
  FocusAwareStatusBar,
  GradientBackdrop,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft } from '@/components/ui/icons';
import { usePaletteColors } from '@/lib/theme';

const SCROLL_CONTENT = {
  flexGrow: 1,
  paddingHorizontal: 22,
  paddingBottom: 36,
} as const;

interface Props {
  kicker: string;
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
    <View className="flex-1 bg-canvas" testID={testID}>
      <GradientBackdrop />
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="h-12 justify-center px-4">
          {onGoBack !== undefined && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              testID="auth-back"
              onPress={onGoBack}
              className="size-10 items-center justify-center rounded-full bg-surface/40 border border-divider active:opacity-70"
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
            <View className="items-center pb-6 pt-2">
              <BrandLockup testID="auth-brand" />
            </View>

            {/* Title & Subtitle */}
            <View className="mb-6 px-1">
              <Text className="font-body-bold text-[12px] uppercase tracking-widest text-accent">
                {kicker}
              </Text>
              <Text className="mt-1 font-heading text-[32px] text-ink">
                {title}
              </Text>
              <Text className="mt-1.5 font-body text-[15px] leading-6 text-tone-700">
                {subtitle}
              </Text>
            </View>

            {/* Modern Card Container */}
            <View
              testID="auth-form-card"
              className="rounded-card border border-white/10 bg-surface/90 p-5 shadow-lg"
            >
              {children}
            </View>

            {footer ? <View className="mt-7">{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import {
  BrandLockup,
  FocusAwareStatusBar,
  GlassCard,
  GradientBackdrop,
  Kicker,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft } from '@/components/ui/icons';
import { usePaletteColors } from '@/lib/theme';

const SCROLL_CONTENT = {
  flexGrow: 1,
  paddingHorizontal: 20,
  paddingBottom: 32,
} as const;

interface Props {
  kicker: string;
  title: string;
  subtitle: string;
  /** Omit when there is no history to pop — the arrow is then hidden. */
  onGoBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
}

/**
 * The shell both auth screens share: gradient backdrop, brand lockup, a title
 * block, the form inside a glass panel, and a footer link. Keeping it in one
 * place is what makes login and register read as the same product.
 */
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
              className="size-10 items-center justify-center rounded-full active:opacity-70"
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
            <View className="items-center pb-7 pt-1">
              <BrandLockup testID="auth-brand" />
            </View>

            <View className="mb-5 px-1">
              <Kicker>{kicker}</Kicker>
              <Text className="mt-1.5 font-heading text-[30px] text-ink">
                {title}
              </Text>
              <Text className="mt-2 text-[15px] leading-6 text-tone-700">
                {subtitle}
              </Text>
            </View>

            <GlassCard testID="auth-form-card">{children}</GlassCard>

            {footer ? <View className="mt-7">{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

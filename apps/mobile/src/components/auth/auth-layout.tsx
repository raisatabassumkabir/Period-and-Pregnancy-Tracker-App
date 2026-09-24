import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import {
  BrandLockup,
  FocusAwareStatusBar,
  Pressable,
  SafeAreaView,
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
  kicker: string;
  title: string;
  subtitle: string;
  onGoBack?: () => void;
  activeTab?: 'login' | 'register';
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
}

export function AuthLayout({
  kicker,
  title,
  subtitle,
  onGoBack,
  activeTab,
  children,
  footer,
  testID,
}: Props) {
  const palette = usePaletteColors();
  const router = useRouter();

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
              className="mb-6 px-1"
            >
              <Text className="mb-1 text-left font-body-semibold text-[14px] text-accent">
                {kicker}
              </Text>
              <Text className="text-left font-heading text-[30px] leading-[36px] tracking-tight text-ink">
                {title}
              </Text>
              <Text className="mt-2 text-left font-body text-[15px] leading-6 text-tone-500">
                {subtitle}
              </Text>
            </Animated.View>

            {/* Segmented Control */}
            {activeTab && (
              <Animated.View
                entering={FadeInDown.delay(150)
                  .duration(800)
                  .springify()
                  .damping(16)}
                className="bg-bg mb-6 flex-row rounded-[16px] p-1"
              >
                <Pressable
                  onPress={() => router.replace('/login')}
                  className={`flex-1 items-center justify-center rounded-[12px] py-3 ${
                    activeTab === 'login' ? 'bg-surface shadow-sm' : ''
                  }`}
                >
                  <Text
                    className={`font-body-semibold text-[15px] ${activeTab === 'login' ? 'text-ink' : 'text-tone-600'}`}
                  >
                    Sign in
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.replace('/register')}
                  className={`flex-1 items-center justify-center rounded-[12px] py-3 ${
                    activeTab === 'register' ? 'bg-surface shadow-sm' : ''
                  }`}
                >
                  <Text
                    className={`font-body-semibold text-[15px] ${activeTab === 'register' ? 'text-ink' : 'text-tone-600'}`}
                  >
                    Register
                  </Text>
                </Pressable>
              </Animated.View>
            )}

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

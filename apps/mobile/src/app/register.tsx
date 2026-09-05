import { Link, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import {
  FocusAwareStatusBar,
  Kicker,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { FormField } from '@/components/ui/form-field';
import { ArrowLeft } from '@/components/ui/icons';
import { useRegisterLogic } from '@/hooks/use-register-logic';
import { usePaletteColors } from '@/lib';

const PRESS_OPACITY = 0.85;

export default function Register() {
  const router = useRouter();
  const { form, handleRegister, isSubmitting, errors } = useRegisterLogic();
  const colors = usePaletteColors();

  // Redirects are the root layout's job — see .claude/rules/react-native.md.

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <View className="flex-row items-center p-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={router.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-4 rounded-full p-2 active:opacity-70"
        >
          <ArrowLeft color={colors.ink} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center space-y-8">
            <View>
              <Kicker>Get started</Kicker>
              <Text className="mt-1 font-heading text-[30px] text-ink">
                Create account
              </Text>
              <Text className="mt-2 text-[15px] text-tone-700">
                Join us and get started in a minute.
              </Text>
            </View>
            <View className="space-y-5">
              {errors.root && (
                <View className="mb-2 rounded-panel border border-danger-200 bg-danger-50 p-4">
                  <Text className="font-body-semibold text-sm text-danger-600">
                    {errors.root.message}
                  </Text>
                </View>
              )}
              <FormField
                control={form.control}
                name="fullName"
                label="Full Name (Optional)"
                placeholder="John Doe"
                autoCapitalize="words"
                returnKeyType="next"
              />
              <FormField
                control={form.control}
                name="email"
                label="Email Address"
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                error={errors.email?.message}
              />
              <FormField
                control={form.control}
                name="password"
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                returnKeyType="next"
                error={errors.password?.message}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                label="Confirm Password"
                placeholder="••••••••"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={form.handleSubmit(handleRegister)}
                error={errors.confirmPassword?.message}
              />
            </View>
            <View className="space-y-4 pt-4">
              <TouchableOpacity
                activeOpacity={PRESS_OPACITY}
                onPress={form.handleSubmit(handleRegister)}
                disabled={isSubmitting}
                accessibilityRole="button"
                testID="register-submit"
                className={`w-full items-center rounded-card bg-accent py-4 ${
                  isSubmitting ? 'opacity-70' : ''
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.accentScale[100]} />
                ) : (
                  <Text className="font-body-bold text-[16px] text-accent-100">
                    Sign up
                  </Text>
                )}
              </TouchableOpacity>
              <View className="flex-row justify-center">
                <Text className="text-[15px] text-tone-700">
                  Already have an account?{' '}
                </Text>
                <Link href="/login" asChild>
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={PRESS_OPACITY}
                  >
                    <Text className="font-body-bold text-[15px] text-accent-700">
                      Log in
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

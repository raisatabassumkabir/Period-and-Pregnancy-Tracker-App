import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import type { TextInput } from 'react-native';

import {
  AuthFooter,
  AuthLayout,
  EmailInput,
  GoogleButton,
  PasswordInput,
} from '@/components/auth';
import { Button, ErrorBanner, Pressable, Text, View } from '@/components/ui';
import { useLoginLogic } from '@/hooks/use-login-logic';
import { usePaletteColors } from '@/lib';
import { CLEAN_TEST_ACCOUNTS, DEMO_ACCOUNTS } from '@/lib/auth/demo-users';

export default function Login() {
  const router = useRouter();
  const palette = usePaletteColors();
  const { form, handleLogin, selectDemoAccount, isSubmitting, errors } =
    useLoginLogic();
  const passwordRef = React.useRef<TextInput | null>(null);

  const submit = form.handleSubmit(handleLogin);

  return (
    <AuthLayout
      testID="login-screen"
      kicker="Welcome back"
      title="Sign in to your account"
      subtitle="Continue your personal health journey."
      activeTab="login"
      footer={
        <AuthFooter
          question="New to Happy Women?"
          linkLabel="Create an account"
          href="/register"
          testID="login-to-register"
        />
      }
    >
      <ErrorBanner message={errors.root?.message} />

      <GoogleButton
        testID="google-login-button"
        onPress={() => {
          // Trigger Google sign-in
        }}
      />

      <View className="my-6 flex-row items-center">
        <View className="h-[1px] flex-1 bg-divider" />
        <Text className="mx-3 font-body-semibold text-[13px] text-tone-500">
          or continue with email
        </Text>
        <View className="h-[1px] flex-1 bg-divider" />
      </View>

      <View className="mb-4">
        <Text className="mb-2 font-body-bold text-[13px] text-ink">
          Email address
        </Text>
        <EmailInput
          control={form.control}
          label=""
          placeholder="you@example.com"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>

      <View className="mb-2">
        <Text className="mb-2 font-body-bold text-[13px] text-ink">
          Password
        </Text>
        <PasswordInput
          control={form.control}
          name="password"
          label=""
          placeholder="Enter your password"
          autoComplete="current-password"
          inputRef={passwordRef}
          onSubmitEditing={submit}
        />
      </View>

      <View className="mb-6 items-end">
        <Pressable onPress={() => {}}>
          <Text className="font-body-semibold text-[13px] text-ink">
            Forgot password?
          </Text>
        </Pressable>
      </View>

      <Button
        label="→ Sign in"
        size="lg"
        className="my-0 h-14"
        style={{
          borderRadius: 16,
        }}
        textClassName="font-body-semibold text-[16px] text-white"
        loading={isSubmitting}
        onPress={submit}
        testID="login-button"
      />

      {__DEV__ && (
        <View className="mt-6 border-t border-divider pt-5">
          <View className="mb-3 flex-row items-center gap-1.5">
            <Sparkles size={16} color={palette.accent} />
            <Text className="font-body-bold text-[13px] text-ink">
              Demo & Test Accounts (Tap to fill & test)
            </Text>
          </View>

          <View className="gap-2.5">
            <Text className="font-body-semibold text-[11px] uppercase tracking-wider text-tone-500">
              Clean-Slate Test Accounts (Forces Onboarding Flow)
            </Text>
            {CLEAN_TEST_ACCOUNTS.map((acc) => (
              <Pressable
                key={acc.email}
                onPress={() => selectDemoAccount(acc.email, acc.password)}
                className="rounded-card border border-accent/20 bg-accent/5 p-3 active:opacity-80"
                testID={`clean-account-${acc.email.split('@')[0]}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-body-bold text-[13px] text-ink">
                    {acc.name}
                  </Text>
                  <View className="rounded-pill bg-accent px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-white">
                      {acc.badge}
                    </Text>
                  </View>
                </View>
                <Text className="mt-0.5 font-mono text-[11px] text-tone-600">
                  {acc.email} • {acc.password}
                </Text>
                <Text className="mt-1 text-[11px] leading-4 text-tone-700">
                  {acc.description}
                </Text>
              </Pressable>
            ))}

            <Text className="mt-2 font-body-semibold text-[11px] uppercase tracking-wider text-tone-500">
              Pre-Seeded Demo Accounts (Skips Onboarding)
            </Text>
            {DEMO_ACCOUNTS.map((acc) => (
              <Pressable
                key={acc.email}
                onPress={() => selectDemoAccount(acc.email, acc.password)}
                className="rounded-card border border-divider bg-surface/80 p-3 active:opacity-80"
                testID={`demo-account-${acc.badge.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-body-bold text-[13px] text-ink">
                    {acc.name}
                  </Text>
                  <View className="rounded-pill bg-accent/15 px-2 py-0.5">
                    <Text className="text-[11px] font-bold text-accent">
                      {acc.badge}
                    </Text>
                  </View>
                </View>
                <Text className="mt-0.5 text-[11px] text-tone-600">
                  {acc.email} • {acc.password}
                </Text>
                <Text className="mt-1 text-[11px] leading-4 text-tone-700">
                  {acc.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </AuthLayout>
  );
}

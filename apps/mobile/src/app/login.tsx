import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import type { TextInput } from 'react-native';

import {
  AuthFooter,
  AuthLayout,
  EmailInput,
  PasswordInput,
} from '@/components/auth';
import { Button, ErrorBanner, Pressable, Text, View } from '@/components/ui';
import { useLoginLogic } from '@/hooks/use-login-logic';
import { usePaletteColors } from '@/lib';
import { DEMO_ACCOUNTS } from '@/lib/auth/demo-users';

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
      kicker="WELCOME BACK"
      title="Log in"
      subtitle="Pick up where you left off — your health data stays private and secure."
      onGoBack={router.canGoBack() ? router.back : undefined}
      footer={
        <AuthFooter
          question="Don't have an account?"
          linkLabel="Register"
          href="/register"
          testID="login-to-register"
        />
      }
    >
      <ErrorBanner message={errors.root?.message} />

      <EmailInput
        control={form.control}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <PasswordInput
        control={form.control}
        name="password"
        label="Password"
        autoComplete="current-password"
        inputRef={passwordRef}
        onSubmitEditing={submit}
      />

      <Button
        label="Log in"
        size="lg"
        className="my-0 mt-3 rounded-pill"
        loading={isSubmitting}
        onPress={submit}
        testID="login-button"
      />

      <View className="mt-6 border-t border-divider pt-5">
        <View className="mb-3 flex-row items-center gap-1.5">
          <Sparkles size={16} color={palette.accent} />
          <Text className="font-body-bold text-[13px] text-ink">
            Demo Accounts (Tap to fill & test POV)
          </Text>
        </View>

        <View className="gap-2.5">
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
    </AuthLayout>
  );
}


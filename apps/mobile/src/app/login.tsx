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

export default function Login() {
  const router = useRouter();
  const palette = usePaletteColors();
  const { form, handleLogin, isSubmitting, errors } = useLoginLogic();
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
    </AuthLayout>
  );
}

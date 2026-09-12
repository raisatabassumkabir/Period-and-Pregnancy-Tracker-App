import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import type { TextInput } from 'react-native';

import {
  AuthFooter,
  AuthLayout,
  EmailInput,
  PasswordHints,
  PasswordInput,
} from '@/components/auth';
import { Button, ErrorBanner, FormField, Pressable, Text, View } from '@/components/ui';
import { useRegisterLogic } from '@/hooks/use-register-logic';
import { usePaletteColors } from '@/lib';

export default function Register() {
  const router = useRouter();
  const palette = usePaletteColors();
  const { form, handleRegister, isSubmitting, errors } = useRegisterLogic();
  const emailRef = React.useRef<TextInput | null>(null);
  const passwordRef = React.useRef<TextInput | null>(null);
  const confirmRef = React.useRef<TextInput | null>(null);

  const submit = form.handleSubmit(handleRegister);
  const password = form.watch('password');

  return (
    <AuthLayout
      testID="register-screen"
      kicker="GET STARTED"
      title="Create account"
      subtitle="Track your cycle or follow your pregnancy — private, personalized, on your terms."
      onGoBack={router.canGoBack() ? router.back : undefined}
      footer={
        <AuthFooter
          question="Already have an account?"
          linkLabel="Log in"
          href="/login"
          testID="register-to-login"
        />
      }
    >
      <ErrorBanner message={errors.root?.message} />

      <FormField
        control={form.control}
        name="fullName"
        label="Full name (optional)"
        testID="full-name-input"
        placeholder="Happy User"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />

      <EmailInput
        control={form.control}
        inputRef={emailRef}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <PasswordInput
        control={form.control}
        name="password"
        label="Password"
        autoComplete="new-password"
        returnKeyType="next"
        inputRef={passwordRef}
        onSubmitEditing={() => confirmRef.current?.focus()}
      />

      <PasswordHints value={password ?? ''} />

      <PasswordInput
        control={form.control}
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        testID="confirm-password-input"
        inputRef={confirmRef}
        onSubmitEditing={submit}
      />

      <Button
        label="Sign up"
        size="lg"
        className="my-0 mt-3 rounded-pill"
        loading={isSubmitting}
        onPress={submit}
        testID="register-submit"
      />
    </AuthLayout>
  );
}

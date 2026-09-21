import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import type { TextInput } from 'react-native';

import {
  AuthFooter,
  AuthLayout,
  EmailInput,
  GoogleButton,
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
      kicker="Join Happy Women"
      title="Create your account"
      subtitle="Start your personal health journey in a few moments."
      activeTab="register"
      footer={
        <AuthFooter
          question="Already have an account?"
          linkLabel="Sign in"
          href="/login"
          testID="register-to-login"
        />
      }
    >
      <ErrorBanner message={errors.root?.message} />

      <GoogleButton
        testID="google-register-button"
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
        <Text className="mb-2 font-body-bold text-[13px] text-ink">Your name</Text>
        <FormField
          control={form.control}
          name="fullName"
          label=""
          testID="full-name-input"
          placeholder="Maya"
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      </View>

      <View className="mb-4">
        <Text className="mb-2 font-body-bold text-[13px] text-ink">Email address</Text>
        <EmailInput
          control={form.control}
          label=""
          placeholder="you@example.com"
          inputRef={emailRef}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>

      <View className="mb-2">
        <Text className="mb-2 font-body-bold text-[13px] text-ink">Password</Text>
        <PasswordInput
          control={form.control}
          name="password"
          label=""
          placeholder="Enter your password"
          autoComplete="new-password"
          returnKeyType="next"
          inputRef={passwordRef}
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
      </View>

      <PasswordHints value={password ?? ''} />

      <View className="mb-6 mt-2">
        <Text className="mb-2 font-body-bold text-[13px] text-ink">Confirm password</Text>
        <PasswordInput
          control={form.control}
          name="confirmPassword"
          label=""
          placeholder="Re-enter password"
          autoComplete="new-password"
          testID="confirm-password-input"
          inputRef={confirmRef}
          onSubmitEditing={submit}
        />
      </View>

      <Button
        label="♡ Create my account"
        size="lg"
        className="my-0 h-14"
        style={{
          borderRadius: 16,
        }}
        textClassName="font-body-semibold text-[16px] text-white"
        loading={isSubmitting}
        onPress={submit}
        testID="register-submit"
      />
    </AuthLayout>
  );
}

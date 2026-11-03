import { Link } from 'expo-router';
import React from 'react';
import type { TextInput } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  AuthFooter,
  AuthLayout,
  DemoAccountsPanel,
  EmailInput,
  GoogleButton,
  GoogleConsentSheet,
  PasswordInput,
  TermsNotice,
} from '@/components/auth';
import {
  Button,
  ErrorBanner,
  Pressable,
  Text,
  useModal,
  View,
} from '@/components/ui';
import { useLoginLogic } from '@/hooks/use-login-logic';

/** The API has no Google sign-in endpoint yet (CONTRACT.md), so say so instead of failing silently. */
function useGoogleSignIn() {
  const sheet = useModal();
  const onContinue = () => {
    sheet.dismiss();
    showMessage({
      message: 'Google sign-in is coming soon',
      description: 'For now, sign in with your email and password.',
      type: 'info',
    });
  };
  return { sheet, onContinue };
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-body-bold text-[13px] text-ink">{children}</Text>
  );
}

function OrDivider() {
  return (
    <View className="my-6 flex-row items-center gap-3">
      <View className="flex-1 border-t border-divider" />
      <Text className="text-[13px] text-tone-500">or</Text>
      <View className="flex-1 border-t border-divider" />
    </View>
  );
}

function ForgotPasswordLink() {
  return (
    <View className="mb-6 mt-1 items-end">
      <Link href="/forgot-password" asChild>
        <Pressable accessibilityRole="link" testID="forgot-password-link">
          <Text className="font-body-semibold text-[14px] text-accent-700">
            Forgot password?
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

export default function Login() {
  const { form, handleLogin, selectDemoAccount, isSubmitting, errors } =
    useLoginLogic();
  const google = useGoogleSignIn();
  const passwordRef = React.useRef<TextInput | null>(null);
  const submit = form.handleSubmit(handleLogin);

  return (
    <AuthLayout
      testID="login-screen"
      kicker="Welcome back"
      title="Sign in"
      subtitle="Continue your personal health journey."
      footer={
        <View className="gap-5">
          <AuthFooter
            question="Don't have an account?"
            linkLabel="Sign up"
            href="/register"
            testID="login-to-register"
          />
          <TermsNotice />
        </View>
      }
    >
      <ErrorBanner message={errors.root?.message} />
      <View className="mb-4">
        <FieldLabel>Email address</FieldLabel>
        <EmailInput
          control={form.control}
          label=""
          placeholder="you@example.com"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>
      <FieldLabel>Password</FieldLabel>
      <PasswordInput
        control={form.control}
        name="password"
        label=""
        placeholder="Enter your password"
        autoComplete="current-password"
        inputRef={passwordRef}
        onSubmitEditing={submit}
      />
      <ForgotPasswordLink />
      <Button
        label="Continue"
        size="lg"
        className="my-0 h-14 rounded-pill"
        textClassName="font-body-semibold text-[16px] text-white"
        loading={isSubmitting}
        onPress={submit}
        testID="login-button"
      />
      <OrDivider />
      <GoogleButton onPress={google.sheet.present} />
      {__DEV__ ? <DemoAccountsPanel onSelect={selectDemoAccount} /> : null}
      <GoogleConsentSheet
        ref={google.sheet.ref}
        onContinue={google.onContinue}
        onCancel={google.sheet.dismiss}
      />
    </AuthLayout>
  );
}

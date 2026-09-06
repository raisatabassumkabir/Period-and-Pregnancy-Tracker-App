import { useRouter } from 'expo-router';
import React from 'react';
import type { TextInput } from 'react-native';

import {
  AuthFooter,
  AuthLayout,
  EmailInput,
  PasswordInput,
} from '@/components/auth';
import { Button, ErrorBanner } from '@/components/ui';
import { useLoginLogic } from '@/hooks/use-login-logic';

export default function Login() {
  const router = useRouter();
  const { form, handleLogin, isSubmitting, errors } = useLoginLogic();
  const passwordRef = React.useRef<TextInput | null>(null);

  const submit = form.handleSubmit(handleLogin);

  return (
    <AuthLayout
      testID="login-screen"
      kicker="Welcome back"
      title="Log in"
      subtitle="Pick up where you left off — your data stays private to you."
      // Login is the root of the stack when the gate redirects here, so there
      // is often nothing to pop.
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
        className="my-0 mt-2 rounded-pill"
        loading={isSubmitting}
        onPress={submit}
        testID="login-button"
      />
    </AuthLayout>
  );
}

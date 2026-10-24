import { Link } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import React from 'react';

import { AuthFooter, AuthLayout, EmailInput } from '@/components/auth';
import { Button, ErrorBanner, Text, View } from '@/components/ui';
import { useForgotPasswordLogic } from '@/hooks/use-forgot-password-logic';
import { usePaletteColors } from '@/lib';

const ICON_SIZE = 28;

function CheckInbox({ email }: { email: string }) {
  const palette = usePaletteColors();
  return (
    <View testID="forgot-password-sent">
      <View className="mb-4 size-14 items-center justify-center rounded-full bg-accent-100">
        <MailCheck size={ICON_SIZE} color={palette.accent} />
      </View>
      <Text className="mb-2 font-body-bold text-[17px] text-ink">
        Check your inbox
      </Text>
      <Text className="mb-6 text-[15px] leading-6 text-tone-700">
        If {email} has an account, a reset link is on its way. It works once and
        expires in an hour. Open it on any device, choose a new password, then
        come back here to sign in.
      </Text>
      <Link href="/login" asChild>
        <Button label="Back to sign in" size="lg" testID="back-to-login" />
      </Link>
    </View>
  );
}

export default function ForgotPassword() {
  const { form, handleRequest, sentTo, isSubmitting, errors } =
    useForgotPasswordLogic();
  const submit = form.handleSubmit(handleRequest);

  return (
    <AuthLayout
      testID="forgot-password-screen"
      kicker="Forgot password"
      title="Reset your password"
      subtitle="Enter the email you signed up with and we'll send you a link."
      footer={
        <AuthFooter
          question="Remembered it?"
          linkLabel="Sign in"
          href="/login"
          testID="forgot-password-to-login"
        />
      }
    >
      {sentTo ? (
        <CheckInbox email={sentTo} />
      ) : (
        <>
          <ErrorBanner message={errors.root?.message} />
          <View className="mb-6">
            <Text className="mb-2 font-body-bold text-[13px] text-ink">
              Email address
            </Text>
            <EmailInput
              control={form.control}
              label=""
              placeholder="you@example.com"
              onSubmitEditing={submit}
            />
          </View>
          <Button
            label="Send reset link"
            size="lg"
            loading={isSubmitting}
            onPress={submit}
            testID="send-reset-link-button"
          />
        </>
      )}
    </AuthLayout>
  );
}

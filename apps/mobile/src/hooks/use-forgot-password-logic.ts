import { zodResolver } from '@hookform/resolvers/zod';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useForgotPassword } from '@/api/auth';

import { applyProblemToForm } from './apply-problem-to-form';
import type { ForgotPasswordFormValues } from './auth-schemas';
import { forgotPasswordSchema } from './auth-schemas';

const FORGOT_PASSWORD_FIELDS = ['email'] as const;

export const useForgotPasswordLogic = () => {
  const mutation = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const handleRequest = async (values: ForgotPasswordFormValues) => {
    const email = values.email.trim();
    try {
      // A fresh key per tap; react-query's own retries reuse it, so a flaky
      // network never produces two emails.
      await mutation.mutateAsync({ email, idempotencyKey: randomUUID() });
      setSentTo(email);
    } catch (error: unknown) {
      applyProblemToForm({
        form,
        error,
        fields: FORGOT_PASSWORD_FIELDS,
        fallback:
          'Could not send the email. Check your connection and try again.',
      });
    }
  };

  return {
    form,
    handleRequest,
    sentTo,
    isSubmitting: mutation.isPending,
    errors: form.formState.errors,
  };
};

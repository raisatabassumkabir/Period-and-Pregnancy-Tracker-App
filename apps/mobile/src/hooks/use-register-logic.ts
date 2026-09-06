import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useLogin, useRegister } from '@/api/auth';
import { useAuth } from '@/lib';

import { applyProblemToForm } from './apply-problem-to-form';
import type { RegisterFormValues } from './auth-schemas';
import { registerSchema } from './auth-schemas';

const REGISTER_FIELDS = ['email', 'password'] as const;

/**
 * Register form state, submission and error mapping.
 *
 * `POST auth/register/` returns the user, not a token pair, so a login call
 * follows immediately; `signIn` then persists the tokens and the root layout
 * performs the stack swap.
 */
export const useRegisterLogic = () => {
  const signIn = useAuth.use.signIn();
  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      // The backend derives identity from email only; the optional full name
      // stays client-side until a profile field exists for it.
      await registerMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });

      const tokens = await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });

      signIn({ access: tokens.access, refresh: tokens.refresh });
    } catch (error: unknown) {
      applyProblemToForm({
        form,
        error,
        fields: REGISTER_FIELDS,
        fallback: 'Could not create your account. Please try again.',
      });
    }
  };

  return {
    form,
    handleRegister,
    isSubmitting,
    errors: form.formState.errors,
  };
};

export type { RegisterFormValues };

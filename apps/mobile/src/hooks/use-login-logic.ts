import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useLogin } from '@/api/auth';
import { useAuth } from '@/lib';

import { applyProblemToForm } from './apply-problem-to-form';
import type { LoginFormValues } from './auth-schemas';
import { loginSchema } from './auth-schemas';

const LOGIN_FIELDS = ['email', 'password'] as const;

export const useLoginLogic = () => {
  const signIn = useAuth.use.signIn();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const handleLogin = async (values: LoginFormValues) => {
    try {
      const tokens = await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });
      signIn({ access: tokens.access, refresh: tokens.refresh });
    } catch (error: unknown) {
      applyProblemToForm({
        form,
        error,
        fields: LOGIN_FIELDS,
        fallback: 'Could not log in. Check your connection and try again.',
      });
    }
  };

  return {
    form,
    handleLogin,
    isSubmitting: loginMutation.isPending,
    errors: form.formState.errors,
  };
};

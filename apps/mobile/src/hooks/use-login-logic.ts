import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useLogin } from '@/api/auth';
import { useAuth } from '@/lib';
import {
  clearUserStateForCleanTest,
  findDemoAccount,
  isCleanTestAccount,
  seedDemoUserState,
} from '@/lib/auth/demo-users';

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
    const trimmedEmail = values.email.trim();

    if (isCleanTestAccount(trimmedEmail)) {
      await clearUserStateForCleanTest();
      try {
        const tokens = await loginMutation.mutateAsync({
          email: trimmedEmail,
          password: values.password,
        });
        signIn({ access: tokens.access, refresh: tokens.refresh });
      } catch {
        // Allows testing clean-slate flow even when local Django backend is offline
        signIn({
          access: `clean-test-access-token`,
          refresh: `clean-test-refresh-token`,
        });
      }
      return;
    }

    const demo = findDemoAccount(trimmedEmail);
    if (demo) {
      await seedDemoUserState(demo);
      signIn({
        access: `demo-access-token-${demo.mode}`,
        refresh: `demo-refresh-token-${demo.mode}`,
      });
      return;
    }

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

  const selectDemoAccount = (email: string, password: string) => {
    form.setValue('email', email, { shouldValidate: true });
    form.setValue('password', password, { shouldValidate: true });
  };

  return {
    form,
    handleLogin,
    selectDemoAccount,
    isSubmitting: loginMutation.isPending,
    errors: form.formState.errors,
  };
};


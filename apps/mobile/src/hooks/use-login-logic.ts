import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';

import { useLogin } from '@/api/auth';
import { useAuth } from '@/lib';
import {
  clearUserStateForCleanTest,
  findDemoAccount,
  isCleanTestAccount,
  offlineTokensFor,
  seedDemoUserState,
} from '@/lib/auth/demo-users';

import { applyProblemToForm } from './apply-problem-to-form';
import type { LoginFormValues } from './auth-schemas';
import { loginSchema } from './auth-schemas';

const LOGIN_FIELDS = ['email', 'password'] as const;

/** No response at all: offline, or the server is down. A 401 is a real answer. */
function isUnreachable(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

/** Demo accounts get their on-phone profile; clean-test ones start blank. */
async function prepareLocalState(email: string): Promise<void> {
  if (isCleanTestAccount(email)) {
    await clearUserStateForCleanTest();
    return;
  }
  const demo = findDemoAccount(email);
  if (demo) await seedDemoUserState(demo);
}

export const useLoginLogic = () => {
  const signIn = useAuth.use.signIn();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  /**
   * Every account, demo ones included, logs in through the real API: demo
   * accounts exist on the server (`manage.py seed_demo_accounts`), so testing
   * them tests the real backend. Only when the server can't be reached at all
   * does a demo login fall back to an offline, on-phone session.
   */
  const handleLogin = async (values: LoginFormValues) => {
    const email = values.email.trim();
    try {
      const tokens = await loginMutation.mutateAsync({
        email,
        password: values.password,
      });
      await prepareLocalState(email);
      signIn({ access: tokens.access, refresh: tokens.refresh });
    } catch (error: unknown) {
      const offline = isUnreachable(error)
        ? offlineTokensFor(email, values.password)
        : null;
      if (offline) {
        await prepareLocalState(email);
        signIn(offline);
        return;
      }
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

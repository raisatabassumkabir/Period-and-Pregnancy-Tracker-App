import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useLogin, useRegister } from '@/api/auth';
import { firstFieldError, isProblemDetail } from '@/api/types';
import { useAuth } from '@/lib';

const schema = z
  .object({
    fullName: z
      .string()
      .refine((val) => val === '' || val.length >= 2, {
        message: 'Name must be at least 2 characters',
      })
      .optional(),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

export type RegisterFormValues = z.infer<typeof schema>;

export const useRegisterLogic = () => {
  const signIn = useAuth.use.signIn();
  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
        full_name: values.fullName?.trim(),
      });

      const loginResponse = await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });

      signIn({
        access: loginResponse.access_token,
        refresh: loginResponse.access_token,
      });
    } catch (error: any) {
      // 422 / 409 problems carry `errors` (field -> messages); everything else
      // has a human `detail`. See packages/api-contract/CONTRACT.md.
      const body = error?.response?.data;
      if (!isProblemDetail(body)) {
        form.setError('root', {
          type: 'manual',
          message: 'Registration failed. Please try again.',
        });
        return;
      }
      const fieldErrors = body.errors ?? {};
      const known: Record<string, 'email' | 'password' | 'fullName'> = {
        email: 'email',
        password: 'password',
        full_name: 'fullName',
      };
      let mappedAField = false;
      for (const key of Object.keys(fieldErrors)) {
        const message = firstFieldError(fieldErrors, key);
        if (!message) continue;
        if (key in known) {
          form.setError(known[key], { type: 'manual', message });
          mappedAField = true;
        } else {
          form.setError('root', { type: 'manual', message });
        }
      }
      if (!mappedAField && !form.formState.errors.root) {
        form.setError('root', { type: 'manual', message: body.detail });
      }
    }
  };

  return {
    form,
    handleRegister,
    isSubmitting,
    errors: form.formState.errors,
  };
};

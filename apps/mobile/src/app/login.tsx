import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert, type TextInput } from 'react-native';
import { z } from 'zod';

import { useLogin } from '@/api/auth';
import { isProblemDetail } from '@/api/types';
import {
  EmailInput,
  LoginActions,
  LoginHeader,
  PasswordInput,
} from '@/components/auth';
import { FocusAwareStatusBar, SafeAreaView, View } from '@/components/ui';
import { useAuth } from '@/lib';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const router = useRouter();
  const signIn = useAuth.use.signIn();
  const passwordInputRef = React.useRef<TextInput>(null);

  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = async (values: FormValues): Promise<void> => {
    try {
      const response = await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });

      signIn({
        access: response.access_token,
        refresh: response.access_token,
      });
    } catch (error: any) {
      // Every error body is an RFC 9457 problem; `detail` is safe to show.
      const body = error?.response?.data;
      const message = isProblemDetail(body)
        ? body.detail
        : 'Login failed. Please try again.';
      Alert.alert('Login Error', message);
    }
  };

  const focusPassword = () => passwordInputRef.current?.focus();

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <LoginHeader onGoBack={() => router.back()} />
      <View className="flex-1 px-6 pt-4">
        <EmailInput
          control={control}
          errors={errors}
          onSubmitEditing={focusPassword}
        />
        <PasswordInput
          ref={passwordInputRef}
          control={control}
          errors={errors}
          onSubmitEditing={handleSubmit(handleLogin)}
        />
        <LoginActions
          isSubmitting={loginMutation.isPending}
          onPress={handleSubmit(handleLogin)}
        />
      </View>
    </SafeAreaView>
  );
}

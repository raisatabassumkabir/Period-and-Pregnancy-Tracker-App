import React, { forwardRef, useState } from 'react';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import { TextInput, TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { Eye, EyeOff } from '@/components/ui/icons';
import { usePaletteColors } from '@/lib';

const PRESS_OPACITY = 0.7;

interface FormValues {
  email: string;
  password: string;
}

interface Props {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  onSubmitEditing: () => void;
}

export const PasswordInput = forwardRef<TextInput, Props>(
  ({ control, errors, onSubmitEditing }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const colors = usePaletteColors();

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    return (
      <View className="mb-6">
        <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
          Password
        </Text>
        <View className="relative">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="password-input"
                ref={ref}
                className="w-full rounded-panel border border-divider bg-surface p-4 pr-14 font-body text-base text-ink"
                placeholder="••••••••"
                placeholderTextColor={colors.tone[500]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={onSubmitEditing}
              />
            )}
          />
          <TouchableOpacity
            activeOpacity={PRESS_OPACITY}
            onPress={togglePasswordVisibility}
            className="absolute right-4 top-4"
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? 'Hide password' : 'Show password'
            }
          >
            {showPassword ? (
              <EyeOff color={colors.tone[600]} />
            ) : (
              <Eye color={colors.tone[600]} />
            )}
          </TouchableOpacity>
        </View>
        {errors.password?.message ? (
          <Text className="mt-1 text-sm text-danger-600">
            {errors.password.message}
          </Text>
        ) : null}
      </View>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

import React from 'react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { TextInput, type TextInputProps, View } from 'react-native';

import { usePaletteColors } from '@/lib/theme';

import { Text } from './text';

interface FormFieldProps<T extends FieldValues> extends Omit<
  TextInputProps,
  'value'
> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
}

/** Labelled, react-hook-form-controlled text input with an inline error line. */
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  ...inputProps
}: FormFieldProps<T>) {
  const colors = usePaletteColors();

  return (
    <View>
      <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className="w-full rounded-panel border border-divider bg-surface p-4 font-body text-base text-ink"
            placeholderTextColor={colors.tone[500]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            {...inputProps}
          />
        )}
      />
      {error && <Text className="mt-1 text-sm text-danger-500">{error}</Text>}
    </View>
  );
}

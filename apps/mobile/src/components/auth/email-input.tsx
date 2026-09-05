import {
  type Control,
  Controller,
  type FieldErrors,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { TextInput } from 'react-native';

import { Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib';

interface Props<TFormValues extends FieldValues & { email: string }> {
  control: Control<TFormValues>;
  errors: FieldErrors<TFormValues>;
  onSubmitEditing: () => void;
}

export function EmailInput<
  TFormValues extends FieldValues & { email: string },
>({ control, errors, onSubmitEditing }: Props<TFormValues>) {
  const colors = usePaletteColors();

  return (
    <View className="mb-5">
      <Text className="mb-2 font-body-semibold text-[13px] text-tone-700">
        Email address
      </Text>
      <Controller
        control={control}
        name={'email' as Path<TFormValues>}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            testID="email-input"
            className="w-full rounded-panel border border-divider bg-surface p-4 font-body text-base text-ink"
            placeholder="user@email.com"
            placeholderTextColor={colors.tone[500]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={onSubmitEditing}
          />
        )}
      />
      {errors.email?.message ? (
        <Text className="mt-1 text-sm text-danger-600">
          {errors.email.message as string}
        </Text>
      ) : null}
    </View>
  );
}

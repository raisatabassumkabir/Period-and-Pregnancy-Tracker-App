import type { Control, FieldValues, Path } from 'react-hook-form';
import type { TextInput } from 'react-native';

import { FormField } from '@/components/ui';

interface Props<T extends FieldValues> {
  control: Control<T>;
  onSubmitEditing?: () => void;
  inputRef?: React.MutableRefObject<TextInput | null>;
  label?: string;
}

/** Email field with the keyboard and autofill hints already set. */
export function EmailInput<T extends FieldValues>({
  control,
  onSubmitEditing,
  inputRef,
  label = 'Email address',
}: Props<T>) {
  return (
    <FormField
      control={control}
      name={'email' as Path<T>}
      label={label}
      testID="email-input"
      placeholder="you@email.com"
      inputRef={inputRef}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      textContentType="emailAddress"
      returnKeyType="next"
      submitBehavior="submit"
      onSubmitEditing={onSubmitEditing}
    />
  );
}

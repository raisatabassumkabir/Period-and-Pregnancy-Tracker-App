import type { Control, FieldValues, Path } from 'react-hook-form';
import type { TextInput } from 'react-native';

import { FormField } from '@/components/ui';

interface Props<T extends FieldValues> extends Omit<TextInputProps, 'onSubmitEditing'> {
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
  label,
  placeholder = 'you@email.com',
  ...rest
}: Props<T>) {
  return (
    <FormField
      control={control}
      name={'email' as Path<T>}
      label={label}
      testID="email-input"
      placeholder={placeholder}
      inputRef={inputRef}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      textContentType="emailAddress"
      returnKeyType="next"
      submitBehavior="submit"
      onSubmitEditing={onSubmitEditing}
      {...rest}
    />
  );
}

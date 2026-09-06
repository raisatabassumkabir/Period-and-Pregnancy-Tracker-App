import React from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';
import type { TextInput } from 'react-native';

import type { NInputProps } from './input';
import { Input } from './input';

interface FormFieldProps<T extends FieldValues> extends Omit<
  NInputProps,
  'value' | 'onChangeText'
> {
  control: Control<T>;
  name: Path<T>;
  /** Overrides the field's own validation message — for server errors. */
  error?: string;
  /** Lets a screen focus this field, e.g. from the previous field's submit. */
  inputRef?: React.Ref<TextInput>;
}

/**
 * A react-hook-form field wearing the shared `Input` skin. This is the only
 * controlled text field in the app; it exists so no screen re-implements
 * labels, focus rings or error lines.
 */
export function FormField<T extends FieldValues>({
  control,
  name,
  error,
  inputRef,
  ...inputProps
}: FormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <Input
      // The caller's ref is forwarded as-is so React performs the assignment;
      // merging it with react-hook-form's own `field.ref` would mean mutating
      // a prop. The only thing that costs us is `form.setFocus(name)`, which
      // no form here uses — screens chain focus through these refs instead.
      ref={inputRef}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      value={(field.value as string) ?? ''}
      error={error ?? fieldState.error?.message}
      {...inputProps}
    />
  );
}

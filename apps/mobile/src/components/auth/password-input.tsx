import React from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import type { TextInput } from 'react-native';

import { FormField, Pressable } from '@/components/ui';
import { Eye, EyeOff } from '@/components/ui/icons';
import { usePaletteColors } from '@/lib/theme';

interface Props<T extends FieldValues> extends Omit<TextInputProps, 'onSubmitEditing'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  /** `new-password` on register so password managers offer to generate one. */
  autoComplete?: 'current-password' | 'new-password';
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  inputRef?: React.MutableRefObject<TextInput | null>;
  testID?: string;
}

/** Password field with an in-field reveal toggle. */
export function PasswordInput<T extends FieldValues>({
  control,
  name,
  label,
  autoComplete = 'current-password',
  returnKeyType = 'done',
  onSubmitEditing,
  inputRef,
  testID = 'password-input',
  placeholder = '••••••••',
  ...rest
}: Props<T>) {
  const [isRevealed, setIsRevealed] = React.useState(false);
  const palette = usePaletteColors();

  const toggle = React.useCallback(() => setIsRevealed((prev) => !prev), []);

  return (
    <FormField
      control={control}
      name={name}
      label={label}
      testID={testID}
      placeholder={placeholder}
      inputRef={inputRef}
      secureTextEntry={!isRevealed}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={autoComplete}
      textContentType={
        autoComplete === 'new-password' ? 'newPassword' : 'password'
      }
      returnKeyType={returnKeyType}
      submitBehavior={returnKeyType === 'next' ? 'submit' : 'blurAndSubmit'}
      onSubmitEditing={onSubmitEditing}
      {...rest}
      rightSlot={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRevealed ? 'Hide password' : 'Show password'}
          testID={`${testID}-reveal`}
          onPress={toggle}
          className="size-10 items-center justify-center rounded-full active:opacity-70"
        >
          {isRevealed ? (
            <EyeOff color={palette.tone[600]} />
          ) : (
            <Eye color={palette.tone[600]} />
          )}
        </Pressable>
      }
    />
  );
}

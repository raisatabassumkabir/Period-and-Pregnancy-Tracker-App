import * as React from 'react';
import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import { useController } from 'react-hook-form';
import type { LayoutChangeEvent, TextInputProps } from 'react-native';
import {
  I18nManager,
  StyleSheet,
  TextInput as NTextInput,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { tv } from 'tailwind-variants';

import { usePaletteColors } from '@/lib/theme';

import colors from './colors';
import { Text } from './text';

/** How far the floating label rises, and how much it shrinks, when lifted. */
const LABEL_LIFT_Y = -12;
const LABEL_LIFT_SCALE = 0.78;
const TRANSITION_MS = 160;
/** Tall enough for a lifted label above a line of body text. */
const FLOATING_FIELD_HEIGHT = 56;
const FRAME_BORDER_WIDTH = 1;
const FRAME_RADIUS = 16;

/**
 * The one input skin in the app. `FormField` composes this with
 * react-hook-form, so every labelled field — auth, settings, assistant —
 * shares these paddings, radii and focus treatment.
 *
 * With a `label` the field uses a floating label: it rests where a placeholder
 * would and lifts on focus or once there is a value. Without one it is a plain
 * field, so the assistant's composer keeps its compact height.
 *
 * Border colour and ground are animated through Reanimated rather than
 * toggled through `className`. That gives the focus ring a real transition,
 * and — per the top-level CLAUDE.md — it avoids ever toggling a shadow utility
 * in a runtime className, which crashes react-native-css-interop. The border
 * width is constant so focusing never shifts the layout by a pixel.
 */
export const inputTv = tv({
  slots: {
    container: 'mb-4',
    label: 'font-body-semibold text-[15px] text-tone-600',
    input: 'mt-0 flex-1 px-4 font-body text-base leading-5 text-ink',
    rightSlot: 'absolute right-3',
    error: 'mt-1.5 font-body-semibold text-[13px] text-danger-500',
  },
  variants: {
    focused: {
      true: { label: 'text-accent-700' },
    },
    error: {
      true: { label: 'text-danger-500' },
    },
    disabled: {
      true: { input: 'text-tone-600' },
    },
    floating: {
      true: { input: 'pb-2 pt-6' },
      false: { input: 'py-3.5' },
    },
    hasRightSlot: {
      true: { input: 'pr-12' },
    },
  },
  defaultVariants: {
    focused: false,
    error: false,
    disabled: false,
    floating: false,
    hasRightSlot: false,
  },
});

export interface NInputProps extends TextInputProps {
  label?: string;
  disabled?: boolean;
  error?: string;
  /** Trailing affordance rendered inside the field — e.g. a reveal-password eye. */
  rightSlot?: React.ReactNode;
}

type TRule<T extends FieldValues> =
  | Omit<
      RegisterOptions<T>,
      'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
    >
  | undefined;

export type RuleType<T extends FieldValues> = { [name in keyof T]: TRule<T> };
export type InputControllerType<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  rules?: RuleType<T>;
};

interface ControlledInputProps<T extends FieldValues>
  extends NInputProps, InputControllerType<T> {}

interface FieldFrameState {
  isFocused: boolean;
  isLifted: boolean;
  hasError: boolean;
  isDisabled: boolean;
}

/** Animated border/ground colours for the frame around the native input. */
function useFrameStyle({ isFocused, hasError, isDisabled }: FieldFrameState) {
  const palette = usePaletteColors();
  const focus = useSharedValue(0);

  React.useEffect(() => {
    focus.value = withTiming(isFocused ? 1 : 0, { duration: TRANSITION_MS });
  }, [focus, isFocused]);

  const restBorder = hasError ? colors.danger[500] : 'transparent';
  const focusBorder = hasError ? colors.danger[500] : palette.accent;
  const restGround = isDisabled ? palette.tone[200] : palette.canvas;
  const focusGround = isDisabled ? palette.tone[200] : palette.canvas;

  return useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [restBorder, focusBorder]
    ),
    backgroundColor: interpolateColor(
      focus.value,
      [0, 1],
      [restGround, focusGround]
    ),
  }));
}

/** Rise-and-shrink transform for the floating label, anchored at its left edge. */
function useLabelStyle(isLifted: boolean) {
  const lift = useSharedValue(isLifted ? 1 : 0);
  const labelWidth = useSharedValue(0);

  React.useEffect(() => {
    lift.value = withTiming(isLifted ? 1 : 0, { duration: TRANSITION_MS });
  }, [isLifted, lift]);

  const onLabelLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      labelWidth.value = event.nativeEvent.layout.width;
    },
    [labelWidth]
  );

  const style = useAnimatedStyle(() => {
    const scale = 1 - lift.value * (1 - LABEL_LIFT_SCALE);
    // Scaling happens about the centre; shift left so the label stays flush.
    const anchorShift = (-(labelWidth.value * (1 - scale)) / 2) * 1;
    return {
      transform: [
        { translateY: lift.value * LABEL_LIFT_Y },
        { translateX: anchorShift },
        { scale },
      ],
    };
  });

  return { style, onLabelLayout };
}

export const Input = React.forwardRef<NTextInput, NInputProps>((props, ref) => {
  const { label, error, testID, rightSlot, placeholder, ...inputProps } = props;
  const palette = usePaletteColors();
  const [isFocused, setIsFocused] = React.useState(false);

  const hasValue = Boolean(inputProps.value && String(inputProps.value).length);
  const isFloating = Boolean(label);
  const isLifted = !isFloating || isFocused || hasValue;

  const onBlur = React.useCallback(
    (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      inputProps.onBlur?.(event);
    },
    [inputProps]
  );
  const onFocus = React.useCallback(
    (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      inputProps.onFocus?.(event);
    },
    [inputProps]
  );

  const frameStyle = useFrameStyle({
    isFocused,
    isLifted,
    hasError: Boolean(error),
    isDisabled: Boolean(props.disabled),
  });
  const { style: labelStyle, onLabelLayout } = useLabelStyle(isLifted);

  const styles = React.useMemo(
    () =>
      inputTv({
        error: Boolean(error),
        focused: isFocused,
        disabled: Boolean(props.disabled),
        floating: isFloating,
        hasRightSlot: Boolean(rightSlot),
      }),
    [error, isFocused, props.disabled, isFloating, rightSlot]
  );

  return (
    <View className={styles.container()}>
      <Animated.View
        style={[
          frameStyle,
          {
            borderWidth: FRAME_BORDER_WIDTH,
            borderRadius: FRAME_RADIUS,
            height: isFloating ? FLOATING_FIELD_HEIGHT : undefined,
            justifyContent: 'center',
          },
        ]}
      >
        {label && (
          <Animated.View
            pointerEvents="none"
            style={[labelStyle, { position: 'absolute', left: 16 }]}
          >
            <Text
              testID={testID ? `${testID}-label` : undefined}
              className={styles.label()}
              onLayout={onLabelLayout}
            >
              {label}
            </Text>
          </Animated.View>
        )}
        <NTextInput
          testID={testID}
          ref={ref}
          placeholder={placeholder}
          // While the label rests in the placeholder position the placeholder
          // stays set (so it is queryable) but is drawn invisible.
          placeholderTextColor={isLifted ? palette.tone[500] : 'transparent'}
          className={styles.input()}
          {...inputProps}
          onBlur={onBlur}
          onFocus={onFocus}
          style={StyleSheet.flatten([
            { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            inputProps.style,
          ])}
        />
        {rightSlot ? (
          <View className={styles.rightSlot()}>{rightSlot}</View>
        ) : null}
      </Animated.View>
      {error && (
        <Text
          testID={testID ? `${testID}-error` : undefined}
          className={styles.error()}
        >
          {error}
        </Text>
      )}
    </View>
  );
});

// only used with react-hook-form
export function ControlledInput<T extends FieldValues>(
  props: ControlledInputProps<T>
) {
  const { name, control, rules, ...inputProps } = props;

  const { field, fieldState } = useController({ control, name, rules });
  return (
    <Input
      ref={field.ref}
      autoCapitalize="none"
      onChangeText={field.onChange}
      value={(field.value as string) || ''}
      {...inputProps}
      error={fieldState.error?.message}
    />
  );
}

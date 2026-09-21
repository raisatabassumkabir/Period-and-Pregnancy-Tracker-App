import React from 'react';
import type { PressableProps, View } from 'react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

const button = tv({
  slots: {
    container:
      'my-2 flex flex-row items-center justify-center rounded-panel px-4',
    label: 'font-body-bold text-base',
    indicator: 'h-6',
  },

  variants: {
    variant: {
      default: {
        container: 'bg-accent shadow-glow-accent active:opacity-90',
        label: 'text-white',
        indicator: 'text-white',
      },
      secondary: {
        container: 'bg-accent2-700 active:opacity-90',
        label: 'text-accent2-100',
        indicator: 'text-accent2-100',
      },
      outline: {
        container: 'border border-divider bg-surface active:opacity-80',
        label: 'text-ink',
        indicator: 'text-ink',
      },
      destructive: {
        container: 'bg-danger-600 active:opacity-90',
        label: 'text-white',
        indicator: 'text-white',
      },
      ghost: {
        container: 'bg-transparent active:opacity-70',
        label: 'text-accent-700 underline',
        indicator: 'text-accent-700',
      },
      link: {
        container: 'bg-transparent active:opacity-70',
        label: 'text-accent-700',
        indicator: 'text-accent-700',
      },
    },
    size: {
      default: {
        container: 'h-12 px-4',
        label: 'text-base',
      },
      lg: {
        container: 'h-14 px-8',
        label: 'text-lg',
      },
      sm: {
        container: 'h-9 px-3',
        label: 'text-sm',
        indicator: 'h-2',
      },
      icon: { container: 'size-9' },
    },
    disabled: {
      true: {
        container: 'bg-tone-300',
        label: 'text-tone-600',
        indicator: 'text-tone-600',
      },
    },
    fullWidth: {
      true: {
        container: '',
      },
      false: {
        container: 'self-center',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    disabled: false,
    fullWidth: true,
    size: 'default',
  },
});

type ButtonVariants = VariantProps<typeof button>;
interface Props extends ButtonVariants, Omit<PressableProps, 'disabled'> {
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button = React.forwardRef<View, Props>(
  (
    {
      label: text,
      loading = false,
      variant = 'default',
      disabled = false,
      size = 'default',
      className = '',
      testID,
      textClassName = '',
      ...props
    },
    ref
  ) => {
    const styles = React.useMemo(
      () => button({ variant, disabled, size }),
      [variant, disabled, size]
    );

    return (
      <Pressable
        disabled={disabled || loading}
        className={styles.container({ className })}
        {...props}
        ref={ref}
        testID={testID}
      >
        {props.children ? (
          props.children
        ) : (
          <>
            {loading ? (
              <ActivityIndicator
                size="small"
                className={styles.indicator()}
                testID={testID ? `${testID}-activity-indicator` : undefined}
              />
            ) : (
              <Text
                testID={testID ? `${testID}-label` : undefined}
                className={styles.label({ className: textClassName })}
              >
                {text}
              </Text>
            )}
          </>
        )}
      </Pressable>
    );
  }
);

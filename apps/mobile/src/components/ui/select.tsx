import {
  BottomSheetFlatList,
  type BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { Check as CheckIcon } from 'lucide-react-native';
import * as React from 'react';
import type { FieldValues } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { Platform, View } from 'react-native';
import { Pressable, type PressableProps } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { tv } from 'tailwind-variants';

import { CaretDown } from '@/components/ui/icons';
import { usePaletteColors } from '@/lib/theme';

import type { InputControllerType } from './input';
import { Modal, useModal } from './modal';
import { Text } from './text';

const selectTv = tv({
  slots: {
    container: 'mb-4',
    label: 'text-grey-100 mb-1 text-lg dark:text-neutral-100',
    input:
      'border-grey-50 mt-0 flex-row items-center justify-center rounded-xl border-[0.5px] p-3  dark:border-neutral-500 dark:bg-neutral-800',
    inputValue: 'dark:text-neutral-100',
  },

  variants: {
    focused: {
      true: {
        input: 'border-neutral-600',
      },
    },
    error: {
      true: {
        input: 'border-danger-600',
        label: 'text-danger-600 dark:text-danger-600',
        inputValue: 'text-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'bg-neutral-200',
      },
    },
  },
  defaultVariants: {
    error: false,
    disabled: false,
  },
});

const List = Platform.OS === 'web' ? FlashList : BottomSheetFlatList;

type OptionIcon = React.ComponentType<{ size?: number; color?: string }>;

export type OptionType = {
  label: string;
  value: string | number;
  /** Optional leading icon, drawn in a soft accent circle. */
  icon?: OptionIcon;
  /** Optional one-line helper under the label. */
  description?: string;
};

type OptionsProps = {
  options: OptionType[];
  onSelect: (option: OptionType) => void;
  value?: string | number;
  /** Sheet heading, e.g. "Theme". */
  title?: string;
  testID?: string;
};

/** Handle + header + list padding; rows are fixed height so the sheet fits them exactly. */
const SHEET_CHROME_HEIGHT = 32;
const SHEET_TITLE_HEIGHT = 44;
const OPTION_ROW_HEIGHT = 72;
const OPTION_ICON_SIZE = 20;
const CHECK_ICON_SIZE = 14;

function keyExtractor(item: OptionType) {
  return `select-item-${item.value}`;
}

export const Options = React.forwardRef<BottomSheetModal, OptionsProps>(
  ({ options, onSelect, value, title, testID }, ref) => {
    const insets = React.useContext(SafeAreaInsetsContext);
    const palette = usePaletteColors();
    const height =
      SHEET_CHROME_HEIGHT +
      (title ? SHEET_TITLE_HEIGHT : 0) +
      options.length * OPTION_ROW_HEIGHT +
      (insets?.bottom ?? 0);
    const snapPoints = React.useMemo(() => [height], [height]);

    const renderSelectItem = React.useCallback(
      ({ item }: { item: OptionType }) => (
        <Option
          key={`select-item-${item.value}`}
          option={item}
          selected={value === item.value}
          onPress={() => onSelect(item)}
          testID={testID ? `${testID}-item-${item.value}` : undefined}
        />
      ),
      [onSelect, value, testID]
    );

    return (
      <Modal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{
          backgroundColor: palette.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
      >
        {title ? (
          <Text className="px-5 pb-3 font-display text-[20px] text-ink">
            {title}
          </Text>
        ) : null}
        <List
          data={options}
          keyExtractor={keyExtractor}
          renderItem={renderSelectItem}
          testID={testID ? `${testID}-modal` : undefined}
          estimatedItemSize={OPTION_ROW_HEIGHT}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </Modal>
    );
  }
);

interface OptionProps extends PressableProps {
  option: OptionType;
  selected?: boolean;
}

/**
 * One choice. Colour-only toggle between states: a runtime-toggled shadow
 * crashes css-interop (see CLAUDE.md gotchas).
 */
const Option = React.memo(
  ({ option, selected = false, ...props }: OptionProps) => {
    const palette = usePaletteColors();
    const Icon = option.icon;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        className={`mb-2 h-16 flex-row items-center gap-3 rounded-panel border px-4 active:opacity-80 ${
          selected ? 'border-accent bg-accent-100' : 'border-divider bg-canvas'
        }`}
        {...props}
      >
        {Icon ? (
          <View
            className={`size-10 items-center justify-center rounded-full ${
              selected ? 'bg-accent' : 'bg-accent-200'
            }`}
          >
            <Icon
              size={OPTION_ICON_SIZE}
              color={selected ? '#FFFFFF' : palette.accent}
            />
          </View>
        ) : null}
        <View className="flex-1">
          <Text
            className={`text-[16px] text-ink ${
              selected ? 'font-body-bold' : 'font-body-semibold'
            }`}
          >
            {option.label}
          </Text>
          {option.description ? (
            <Text className="text-[12px] text-tone-600" numberOfLines={1}>
              {option.description}
            </Text>
          ) : null}
        </View>
        {selected ? (
          <View className="size-6 items-center justify-center rounded-full bg-accent">
            <CheckIcon size={CHECK_ICON_SIZE} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : (
          <View className="size-6 rounded-full border-2 border-tone-300" />
        )}
      </Pressable>
    );
  }
);

export interface SelectProps {
  value?: string | number;
  label?: string;
  disabled?: boolean;
  error?: string;
  options?: OptionType[];
  onSelect?: (value: string | number) => void;
  placeholder?: string;
  testID?: string;
}
interface ControlledSelectProps<T extends FieldValues>
  extends SelectProps, InputControllerType<T> {}

export const Select = (props: SelectProps) => {
  const {
    label,
    value,
    error,
    options = [],
    placeholder = 'select...',
    disabled = false,
    onSelect,
    testID,
  } = props;
  const modal = useModal();

  const onSelectOption = React.useCallback(
    (option: OptionType) => {
      onSelect?.(option.value);
      modal.dismiss();
    },
    [modal, onSelect]
  );

  const styles = React.useMemo(
    () =>
      selectTv({
        error: Boolean(error),
        disabled,
      }),
    [error, disabled]
  );

  const textValue = React.useMemo(
    () =>
      value !== undefined
        ? (options?.filter((t) => t.value === value)?.[0]?.label ?? placeholder)
        : placeholder,
    [value, options, placeholder]
  );

  return (
    <>
      <View className={styles.container()}>
        {label && (
          <Text
            testID={testID ? `${testID}-label` : undefined}
            className={styles.label()}
          >
            {label}
          </Text>
        )}
        <Pressable
          className={styles.input()}
          disabled={disabled}
          onPress={modal.present}
          testID={testID ? `${testID}-trigger` : undefined}
        >
          <View className="flex-1">
            <Text className={styles.inputValue()}>{textValue}</Text>
          </View>
          <CaretDown />
        </Pressable>
        {error && (
          <Text
            testID={`${testID}-error`}
            className="text-sm text-danger-300 dark:text-danger-600"
          >
            {error}
          </Text>
        )}
      </View>
      <Options
        testID={testID}
        ref={modal.ref}
        options={options}
        onSelect={onSelectOption}
      />
    </>
  );
};

// only used with react-hook-form
export function ControlledSelect<T extends FieldValues>(
  props: ControlledSelectProps<T>
) {
  const { name, control, rules, onSelect: onNSelect, ...selectProps } = props;

  const { field, fieldState } = useController({ control, name, rules });
  const onSelect = React.useCallback(
    (value: string | number) => {
      field.onChange(value);
      onNSelect?.(value);
    },
    [field, onNSelect]
  );
  return (
    <Select
      onSelect={onSelect}
      value={field.value}
      error={fieldState.error?.message}
      {...selectProps}
    />
  );
}

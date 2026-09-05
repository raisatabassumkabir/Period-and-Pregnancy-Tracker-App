import { ChevronRight } from 'lucide-react-native';
import * as React from 'react';

import { Pressable, Text, View } from '@/components/ui';
import type { TxKeyPath } from '@/lib';
import { usePaletteColors } from '@/lib';

const CHEVRON_SIZE = 18;

type ItemProps = {
  text: TxKeyPath;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  isDestructive?: boolean;
  /** Also emits `${testID}-value`, so a row can be asserted on independently
   *  of any picker sheet that renders the same label. */
  testID?: string;
};

/**
 * One settings row. The separator is drawn by `ItemsContainer` rather than
 * here, so the last row never leaves a hairline against the card's rounded
 * bottom edge.
 */
export const Item = ({
  text,
  value,
  icon,
  onPress,
  isDestructive,
  testID,
}: ItemProps) => {
  const isPressable = onPress !== undefined;
  const colors = usePaletteColors();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      pointerEvents={isPressable ? 'auto' : 'none'}
      // WHY no `flex-1`: the row sits in a content-height column. A column of
      // nothing but `flex-1` children has no definite height to divide, so
      // every row collapses to zero and the whole card renders as a hairline.
      className="flex-row items-center justify-between px-4 py-3.5 active:bg-tone-200"
    >
      <View className="flex-1 flex-row items-center">
        {icon && <View className="mr-3">{icon}</View>}
        <Text
          tx={text}
          className={`flex-1 font-body-semibold text-[15px] ${
            isDestructive ? 'text-danger-600' : 'text-ink'
          }`}
        />
      </View>
      <View className="flex-row items-center gap-1.5">
        {value && (
          <Text
            testID={testID ? `${testID}-value` : undefined}
            className="text-[13px] text-tone-700"
          >
            {value}
          </Text>
        )}
        {isPressable && (
          <ChevronRight size={CHEVRON_SIZE} color={colors.tone[500]} />
        )}
      </View>
    </Pressable>
  );
};

import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Check, ChevronDown } from 'lucide-react-native';
import React from 'react';

import { Modal, Pressable, Text, useModal } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

const MONTHS_IN_YEAR = 12;
const ROW_HEIGHT = 56;
const SHEET_CHROME_HEIGHT = 120;
const ICON_SIZE = 18;

interface Props {
  year: number;
  monthIndex: number;
  onSelectMonth: (monthIndex: number) => void;
}

function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
  });
}

/** Rows omit the year — the sheet title already carries it. */
function monthName(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en', {
    month: 'long',
  });
}

/** "March 2026 ▾" — opens a sheet listing the twelve months of `year`. */
export function MonthPicker({ year, monthIndex, onSelectMonth }: Props) {
  const modal = useModal();
  const palette = usePaletteColors();
  const snapPoints = React.useMemo(
    () => [MONTHS_IN_YEAR * ROW_HEIGHT + SHEET_CHROME_HEIGHT],
    []
  );

  const select = (index: number) => {
    onSelectMonth(index);
    modal.dismiss();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose month"
        testID="calendar-month-trigger"
        onPress={modal.present}
        className="flex-row items-center gap-1.5 rounded-pill bg-surface px-4 py-2"
      >
        <Text className="font-heading text-[17px] text-ink">
          {monthLabel(year, monthIndex)}
        </Text>
        <ChevronDown size={ICON_SIZE} color={palette.ink} />
      </Pressable>
      <Modal
        ref={modal.ref}
        snapPoints={snapPoints}
        title={String(year)}
        backgroundStyle={{ backgroundColor: palette.canvas }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 16 }}>
          {Array.from({ length: MONTHS_IN_YEAR }, (_, index) => {
            const selected = index === monthIndex;
            return (
              <Pressable
                key={index}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                testID={`calendar-month-option-${index}`}
                onPress={() => select(index)}
                className={`mb-2 flex-row items-center justify-between rounded-pill px-4 py-3 ${
                  selected ? 'bg-accent-200' : 'bg-surface'
                }`}
              >
                <Text
                  className={`text-[15px] ${
                    selected
                      ? 'font-body-bold text-accent-800'
                      : 'font-body-semibold text-ink'
                  }`}
                >
                  {monthName(year, index)}
                </Text>
                {selected && <Check size={ICON_SIZE} color={palette.accent} />}
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </Modal>
    </>
  );
}

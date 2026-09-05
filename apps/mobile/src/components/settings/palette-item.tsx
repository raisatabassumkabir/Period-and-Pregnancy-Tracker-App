import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Check, SwatchBook } from 'lucide-react-native';
import React from 'react';

import { Modal, Pressable, Text, useModal, View } from '@/components/ui';
import type { PaletteId } from '@/lib';
import {
  PALETTE_IDS,
  PALETTES,
  usePaletteColors,
  useSelectedPalette,
} from '@/lib';

import { Item } from './item';

const ICON_SIZE = 20;
const ROW_HEIGHT = 76;
const SNAP_HEIGHT = PALETTE_IDS.length * ROW_HEIGHT + 140;

interface PaletteRowProps {
  id: PaletteId;
  isSelected: boolean;
  onSelect: (id: PaletteId) => void;
}

/**
 * Swatches are drawn from each palette's own `swatch` hexes rather than from the
 * live CSS variables — the whole point of the row is to preview a palette that
 * is *not* currently applied.
 */
const PaletteRow = ({ id, isSelected, onSelect }: PaletteRowProps) => {
  const palette = PALETTES[id];
  const handlePress = React.useCallback(() => onSelect(id), [id, onSelect]);

  return (
    <Pressable
      onPress={handlePress}
      testID={`palette-option-${id}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={palette.label}
      className={`mb-2 flex-row items-center rounded-panel border-2 px-4 py-3 ${
        isSelected
          ? 'border-accent bg-accent-200'
          : 'border-transparent bg-surface'
      }`}
    >
      <View
        className="mr-3 h-11 w-11 flex-row overflow-hidden rounded-full"
        style={{ backgroundColor: palette.swatch.bg }}
      >
        <View
          className="h-full flex-1"
          style={{ backgroundColor: palette.swatch.accent }}
        />
        <View
          className="h-full flex-1"
          style={{ backgroundColor: palette.swatch.accent2 }}
        />
      </View>

      <Text
        className={`flex-1 font-body-semibold text-base ${
          isSelected ? 'text-accent-800' : 'text-ink'
        }`}
      >
        {palette.label}
      </Text>

      {isSelected && (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-accent-700">
          <Check size={14} color="#ffffff" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
};

export const PaletteItem = () => {
  const { selectedPalette, setSelectedPalette } = useSelectedPalette();
  const colors = usePaletteColors();
  const modal = useModal();

  const onSelect = React.useCallback(
    (id: PaletteId) => {
      setSelectedPalette(id);
      modal.dismiss();
    },
    [setSelectedPalette, modal]
  );

  const snapPoints = React.useMemo(() => [SNAP_HEIGHT], []);

  return (
    <>
      <Item
        testID="settings-palette-row"
        text="settings.palette.title"
        value={PALETTES[selectedPalette].label}
        icon={<SwatchBook size={ICON_SIZE} color={colors.tone[600]} />}
        onPress={modal.present}
      />
      <Modal
        ref={modal.ref}
        snapPoints={snapPoints}
        title="Colour palette"
        backgroundStyle={{ backgroundColor: colors.canvas }}
      >
        <BottomSheetScrollView
          testID="palette-picker-sheet"
          contentContainerStyle={{ padding: 16 }}
        >
          {PALETTE_IDS.map((id) => (
            <PaletteRow
              key={id}
              id={id}
              isSelected={id === selectedPalette}
              onSelect={onSelect}
            />
          ))}
        </BottomSheetScrollView>
      </Modal>
    </>
  );
};

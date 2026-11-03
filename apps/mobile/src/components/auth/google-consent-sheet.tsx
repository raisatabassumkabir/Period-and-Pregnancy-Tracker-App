import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { BrandMark, Button, Modal, Text, View } from '@/components/ui';
import { usePaletteColors } from '@/lib/theme';

import { GoogleIcon } from './google-button';
import { TermsNotice } from './terms-notice';

/** Handle + title + body + terms + two buttons; measured on a Pixel-size screen. */
const LOGO_MARK_SIZE = 37; // BrandMark renders at 1.5x, so this matches the 56px Google badge.
const SHEET_CONTENT_HEIGHT = 380;
const SHEET_RADIUS = 28;

interface Props {
  onContinue: () => void;
  onCancel: () => void;
}

function SheetHeader() {
  return (
    <View className="items-center">
      <View className="flex-row items-center gap-3">
        <View className="size-14 items-center justify-center rounded-full border border-divider bg-canvas">
          <GoogleIcon size={26} />
        </View>
        <View className="h-px w-6 bg-tone-300" />
        <BrandMark size={LOGO_MARK_SIZE} />
      </View>
      <Text className="mt-5 text-center font-heading text-[22px] leading-7 text-ink">
        Sign in to Happy Women
      </Text>
      <Text className="mt-2 text-center text-[14px] leading-5 text-tone-600">
        Google will share your name, email address and profile picture with
        Happy Women.
      </Text>
    </View>
  );
}

/** The Play-Store-style "Sign in with Google" consent step: terms, Continue, Cancel. */
export const GoogleConsentSheet = React.forwardRef<BottomSheetModal, Props>(
  ({ onContinue, onCancel }, ref) => {
    const palette = usePaletteColors();
    const insets = React.useContext(SafeAreaInsetsContext);
    const snapPoints = React.useMemo(
      () => [SHEET_CONTENT_HEIGHT + (insets?.bottom ?? 0)],
      [insets?.bottom]
    );
    return (
      <Modal
        ref={ref}
        snapPoints={snapPoints}
        backgroundStyle={{
          backgroundColor: palette.surface,
          borderTopLeftRadius: SHEET_RADIUS,
          borderTopRightRadius: SHEET_RADIUS,
        }}
      >
        <View className="flex-1 px-6" testID="google-consent-sheet">
          <SheetHeader />
          <TermsNotice className="mt-5" />
          <View className="mt-6 gap-3">
            <Button
              label="Continue"
              size="lg"
              onPress={onContinue}
              className="my-0 h-14 rounded-pill"
              testID="google-consent-continue"
            />
            <Button
              label="Cancel"
              variant="outline"
              size="lg"
              onPress={onCancel}
              className="my-0 h-14 rounded-pill"
              testID="google-consent-cancel"
            />
          </View>
        </View>
      </Modal>
    );
  }
);

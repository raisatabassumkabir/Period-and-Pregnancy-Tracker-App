import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import type { PillOption } from '@/components/ui';
import { OptionPills, Text } from '@/components/ui';
import type { GuideAudience } from '@/lib/cycle-education';
import { PHASE_GUIDES } from '@/lib/cycle-education';
import type { CycleDietPhase } from '@/lib/diet';
import { CYCLE_DIET_PHASES } from '@/lib/diet';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

const SHEET_BOTTOM_PADDING = 16;
const CLOSE_ICON_SIZE = 18;

const phaseOptions = (): readonly PillOption<CycleDietPhase>[] =>
  CYCLE_DIET_PHASES.map((phase) => ({
    value: phase,
    label: translate(PHASE_GUIDES[phase].nameKey),
  }));

function GuideSection({
  labelKey,
  bodyKey,
}: {
  labelKey: TxKeyPath;
  bodyKey: TxKeyPath;
}) {
  return (
    <View className="mt-4">
      <Text className="font-body-bold text-[13px] text-accent">
        {translate(labelKey)}
      </Text>
      <Text className="mt-1 text-[14px] leading-5 text-ink">
        {translate(bodyKey)}
      </Text>
    </View>
  );
}

/** Every section of one phase; the partner tip leads when a partner reads it. */
export function PhaseGuideDetails({
  phase,
  audience,
}: {
  phase: CycleDietPhase;
  audience: GuideAudience;
}) {
  const guide = PHASE_GUIDES[phase];
  const partnerSection = (
    <GuideSection
      labelKey="cycle_guide.partner_tip"
      bodyKey={guide.partnerKey}
    />
  );
  return (
    <View testID={`phase-guide-${phase}`}>
      <Text className="mt-4 text-[12px] text-tone-600">
        {translate(guide.daysKey)}
      </Text>
      {audience === 'partner' ? partnerSection : null}
      <GuideSection labelKey="cycle_guide.mood" bodyKey={guide.moodKey} />
      <GuideSection labelKey="cycle_guide.energy" bodyKey={guide.energyKey} />
      <GuideSection
        labelKey="cycle_guide.hormones"
        bodyKey={guide.hormonesKey}
      />
      <GuideSection
        labelKey="cycle_guide.self_care"
        bodyKey={guide.selfCareKey}
      />
      {audience === 'self' ? partnerSection : null}
    </View>
  );
}

function SheetHeader({ onClose }: { onClose: () => void }) {
  const palette = usePaletteColors();
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <Text className="font-body-bold text-[11px] uppercase tracking-[1.5px] text-accent">
          {translate('cycle_guide.sheet_kicker')}
        </Text>
        <Text className="mt-1 font-heading text-[22px] leading-7 text-ink">
          {translate('cycle_guide.learn_more')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        hitSlop={8}
        testID="phase-guide-close"
        className="size-9 items-center justify-center rounded-full bg-canvas active:opacity-70"
      >
        <X size={CLOSE_ICON_SIZE} color={palette.ink} />
      </Pressable>
    </View>
  );
}

export interface PhaseGuideSheetProps {
  visible: boolean;
  onClose: () => void;
  initialPhase: CycleDietPhase;
  audience: GuideAudience;
}

/** All four phases, one at a time, picked with pills. */
export function PhaseGuideSheet({
  visible,
  onClose,
  initialPhase,
  audience,
}: PhaseGuideSheetProps) {
  const insets = React.useContext(SafeAreaInsetsContext);
  const [phase, setPhase] = React.useState<CycleDietPhase>(initialPhase);
  React.useEffect(() => {
    if (visible) setPhase(initialPhase);
  }, [visible, initialPhase]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="phase-guide-sheet"
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View
          className="max-h-[92%] rounded-t-[28px] bg-surface px-5 pt-3"
          style={{
            paddingBottom: (insets?.bottom ?? 0) + SHEET_BOTTOM_PADDING,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View className="mb-4 h-1 w-10 self-center rounded-pill bg-tone-300" />
            <SheetHeader onClose={onClose} />
            <View className="mt-4">
              <OptionPills
                options={phaseOptions()}
                value={phase}
                onChange={setPhase}
                accessibilityLabel={translate('cycle_guide.learn_more')}
                testID="phase-guide-tabs"
              />
            </View>
            <PhaseGuideDetails phase={phase} audience={audience} />
            <Text className="mt-5 text-[12px] leading-5 text-tone-600">
              {translate('cycle_guide.disclaimer')}
            </Text>
            <Text className="mt-1 text-[12px] text-tone-500">
              {translate('cycle_guide.source')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

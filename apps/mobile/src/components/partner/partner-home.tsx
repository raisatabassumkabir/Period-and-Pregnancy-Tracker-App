import React from 'react';
import { View } from 'react-native';

import { PhaseGuideCard } from '@/components/cycle-education';
import { Text } from '@/components/ui';
import { PREGNANCY_GUIDE_KEYS } from '@/lib/cycle-education';
import { trimesterForWeek } from '@/lib/health';
import { translate } from '@/lib/i18n';
import type { SupportTopic } from '@/lib/partner';
import { usePartnerSide } from '@/lib/partner';

import { ConceiveCard } from './conceive-card';
import { NotLinkedCard } from './not-linked-card';
import { NudgeToggle } from './nudge-toggle';
import { PartnerStatusCard } from './partner-status-card';
import { KindNoteCard, SupportActionsCard } from './support-idea-card';

/** Home for a linked partner: her status, how she may feel, and how to help. */
export function PartnerHome() {
  const { link, view, isPartner } = usePartnerSide();
  if (!isPartner) return <NotLinkedCard />;
  const name = link?.other_name || translate('partner.home.her_name_fallback');
  const topic: SupportTopic | null =
    view.kind === 'pregnancy' ? 'pregnancy' : view.phase;

  return (
    <View className="gap-4" testID="partner-home">
      <PartnerStatusCard view={view} name={name} />
      {view.phase ? (
        <PhaseGuideCard phase={view.phase} audience="partner" />
      ) : null}
      {view.kind === 'pregnancy' && view.pregnancyWeek ? (
        <Text className="px-1 text-[14px] leading-5 text-tone-700">
          {translate(
            PREGNANCY_GUIDE_KEYS[trimesterForWeek(view.pregnancyWeek)]
          )}
        </Text>
      ) : null}
      {topic ? <SupportActionsCard topic={topic} /> : null}
      {topic ? <KindNoteCard topic={topic} /> : null}
      <ConceiveCard view={view} />
      <NudgeToggle />
    </View>
  );
}

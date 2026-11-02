import { HeartHandshake } from 'lucide-react-native';
import React from 'react';
import { Alert, Switch, View } from 'react-native';

import { useUnlinkPartner, useUpdatePartnerLink } from '@/api/sharing';
import type { PartnerLink, PartnerLinkUpdate } from '@/api/types';
import { Button, Text } from '@/components/ui';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 22;

interface ShareSwitchProps {
  labelKey: TxKeyPath;
  hintKey?: TxKeyPath;
  value: boolean;
  onChange: (next: boolean) => void;
  testID: string;
}

function ShareSwitch({
  labelKey,
  hintKey,
  value,
  onChange,
  testID,
}: ShareSwitchProps) {
  const palette = usePaletteColors();
  return (
    <View className="mt-4 flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Text className="font-body-bold text-[15px] text-ink">
          {translate(labelKey)}
        </Text>
        {hintKey ? (
          <Text className="text-[12px] text-tone-600">
            {translate(hintKey)}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: palette.tone[300], true: palette.accent }}
        thumbColor="#FFFFFF"
        accessibilityLabel={translate(labelKey)}
        testID={testID}
      />
    </View>
  );
}

function OwnerControls({ link }: { link: PartnerLink }) {
  const update = useUpdatePartnerLink();
  const change = (changes: PartnerLinkUpdate) =>
    update.mutate({ id: link.id, ...changes });
  return (
    <>
      <Text className="mt-3 text-[13px] leading-5 text-tone-700">
        {translate('partner.linked.sees')}
      </Text>
      <ShareSwitch
        labelKey="partner.linked.share_fertile"
        hintKey="partner.linked.share_fertile_hint"
        value={link.share_fertile_window}
        onChange={(next) => change({ share_fertile_window: next })}
        testID="partner-share-fertile"
      />
      <ShareSwitch
        labelKey="partner.linked.share_pregnancy"
        value={link.share_pregnancy}
        onChange={(next) => change({ share_pregnancy: next })}
        testID="partner-share-pregnancy"
      />
    </>
  );
}

/** Either side once linked: who, (her) what is shared, and unlink. */
export function LinkedCard({ link }: { link: PartnerLink }) {
  const palette = usePaletteColors();
  const unlink = useUnlinkPartner();
  const title = link.other_name
    ? translate('partner.linked.title', { name: link.other_name })
    : translate('partner.linked.title_unnamed');

  const confirmUnlink = () =>
    Alert.alert(
      translate('partner.linked.unlink'),
      translate('partner.linked.unlink_confirm'),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('partner.linked.unlink'),
          style: 'destructive',
          onPress: () => unlink.mutate({ id: link.id }),
        },
      ]
    );

  return (
    <View className="rounded-card bg-surface p-5" testID="partner-linked-card">
      <View className="flex-row items-center gap-3">
        <View className="size-11 items-center justify-center rounded-full bg-accent-200">
          <HeartHandshake size={ICON_SIZE} color={palette.accent} />
        </View>
        <Text className="flex-1 font-heading text-[19px] text-ink">
          {title}
        </Text>
      </View>
      {link.role === 'owner' ? <OwnerControls link={link} /> : null}
      <Button
        variant="outline"
        label={translate('partner.linked.unlink')}
        loading={unlink.isPending}
        onPress={confirmUnlink}
        testID="partner-unlink"
        className="mt-5 rounded-pill"
      />
    </View>
  );
}

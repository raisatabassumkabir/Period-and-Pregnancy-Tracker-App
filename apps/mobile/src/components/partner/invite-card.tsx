import React from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { useCreatePartnerInvite } from '@/api/sharing';
import type { PartnerInviteCreated } from '@/api/types';
import { Button, Input, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { sendOnWhatsApp, shareText } from '@/lib/partner';

const NAME_MAX_LENGTH = 40;

function inviteMessage(invite: PartnerInviteCreated): string {
  return translate('partner.invite.message', {
    url: invite.url,
    code: invite.code,
  });
}

function reportShareError() {
  showMessage({
    message: translate('partner.invite.share_failed'),
    type: 'warning',
  });
}

function InviteCode({ invite }: { invite: PartnerInviteCreated }) {
  const message = inviteMessage(invite);
  return (
    <View className="mt-4 items-center rounded-panel bg-accent-100 p-4">
      <Text className="text-[12px] text-tone-600">
        {translate('partner.invite.code_label')}
      </Text>
      <Text
        selectable
        className="mt-1 font-heading text-[26px] tracking-[2px] text-ink"
        testID="partner-invite-code"
      >
        {invite.code}
      </Text>
      <Text className="mt-1 text-[12px] text-tone-600">
        {translate('partner.invite.expires')}
      </Text>
      <View className="mt-4 w-full gap-2">
        <Button
          label={translate('partner.invite.whatsapp')}
          onPress={() => sendOnWhatsApp(message).catch(reportShareError)}
          testID="partner-invite-whatsapp"
          className="rounded-pill"
        />
        <Button
          variant="outline"
          label={translate('partner.invite.share')}
          onPress={() => shareText(message).catch(reportShareError)}
          testID="partner-invite-share"
          className="rounded-pill"
        />
      </View>
    </View>
  );
}

/** Her side, not yet linked: name, create the invite, send it. */
export function InviteCard() {
  const [name, setName] = React.useState('');
  const create = useCreatePartnerInvite();

  return (
    <View className="rounded-card bg-surface p-5" testID="partner-invite-card">
      <Text className="font-heading text-[20px] text-ink">
        {translate('partner.invite.title')}
      </Text>
      <Text className="mt-2 text-[14px] leading-5 text-tone-700">
        {translate('partner.invite.body')}
      </Text>
      <View className="mt-4">
        <Input
          label={translate('partner.invite.your_name')}
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX_LENGTH}
          testID="partner-invite-name"
        />
      </View>
      <Button
        label={translate('partner.invite.create')}
        loading={create.isPending}
        onPress={() => create.mutate({ display_name: name.trim() })}
        testID="partner-invite-create"
        className="mt-2 rounded-pill"
      />
      {create.data ? <InviteCode invite={create.data} /> : null}
    </View>
  );
}

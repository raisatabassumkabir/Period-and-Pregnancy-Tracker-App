import { Copy } from 'lucide-react-native';
import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  useCancelPartnerInvite,
  useCreatePartnerInvite,
  useOpenInvite,
} from '@/api/sharing';
import type { PartnerInvite } from '@/api/types';
import { Button, ErrorBanner, Input, Text } from '@/components/ui';
import { formatCalendarDate, toDateString } from '@/lib/health';
import { translate } from '@/lib/i18n';
import {
  copyText,
  partnerErrorMessage,
  sendOnWhatsApp,
  shareText,
} from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

const NAME_MAX_LENGTH = 40;
const ICON_SIZE = 16;

function inviteMessage(invite: PartnerInvite): string {
  return translate('partner.invite.message', {
    url: invite.url,
    code: invite.code,
  });
}

function warn(message: string) {
  showMessage({ message, type: 'warning' });
}

async function copyLink(invite: PartnerInvite) {
  const outcome = await copyText(invite.url);
  showMessage(
    outcome === 'copied'
      ? { message: translate('partner.invite.copied'), type: 'success' }
      : { message: translate('partner.invite.copy_shared'), type: 'info' }
  );
}

/** The code and link, tappable to copy (long-press also selects the text). */
function CodeBox({ invite }: { invite: PartnerInvite }) {
  const palette = usePaletteColors();
  const expires = formatCalendarDate(toDateString(new Date(invite.expires_at)));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={translate('partner.invite.tap_to_copy')}
      onPress={() =>
        copyLink(invite).catch(() =>
          warn(translate('partner.invite.share_failed'))
        )
      }
      testID="partner-invite-copy-box"
      className="mt-4 items-center rounded-panel bg-accent-100 p-4 active:opacity-80"
    >
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
      <Text className="mt-3 text-[12px] text-tone-600">
        {translate('partner.invite.link_label')}
      </Text>
      <Text
        selectable
        numberOfLines={2}
        className="mt-0.5 text-center text-[13px] text-accent-700"
        testID="partner-invite-url"
      >
        {invite.url}
      </Text>
      <View className="mt-3 flex-row items-center gap-1.5">
        <Copy size={ICON_SIZE} color={palette.tone[500]} />
        <Text className="text-[12px] text-tone-600">
          {translate('partner.invite.valid_until', { date: expires })}
        </Text>
      </View>
    </Pressable>
  );
}

function ShareButtons({ invite }: { invite: PartnerInvite }) {
  const message = inviteMessage(invite);
  const failed = () => warn(translate('partner.invite.share_failed'));
  return (
    <View className="mt-4 gap-2">
      <Button
        label={translate('partner.invite.send_code')}
        onPress={() => sendOnWhatsApp(message).catch(failed)}
        testID="partner-invite-whatsapp"
        className="rounded-pill"
      />
      <Button
        variant="outline"
        label={translate('partner.invite.copy_link')}
        onPress={() => copyLink(invite).catch(failed)}
        testID="partner-invite-copy"
        className="rounded-pill"
      />
      <Button
        variant="outline"
        label={translate('partner.invite.share')}
        onPress={() => shareText(message).catch(failed)}
        testID="partner-invite-share"
        className="rounded-pill"
      />
    </View>
  );
}

/** Her open invite: code, link, ways to send it, and how to replace or cancel it. */
function OpenInvite({ invite }: { invite: PartnerInvite }) {
  const create = useCreatePartnerInvite();
  const cancel = useCancelPartnerInvite();
  const confirmCancel = () =>
    Alert.alert(
      translate('partner.invite.cancel'),
      translate('partner.invite.cancel_confirm'),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('partner.invite.cancel'),
          style: 'destructive',
          onPress: () => cancel.mutate({ id: invite.id }),
        },
      ]
    );
  return (
    <>
      <Text className="mt-2 text-[14px] leading-5 text-tone-700">
        {translate('partner.invite.share_body')}
      </Text>
      <CodeBox invite={invite} />
      <ShareButtons invite={invite} />
      <ErrorBanner
        message={partnerErrorMessage(create.error ?? cancel.error)}
      />
      <Text className="mt-4 text-center text-[12px] text-tone-600">
        {translate('partner.invite.pull_to_refresh')}
      </Text>
      <Button
        variant="link"
        label={translate('partner.invite.lost_code')}
        loading={create.isPending}
        onPress={() => create.mutate({ display_name: invite.display_name })}
        testID="partner-invite-new-code"
      />
      <Button
        variant="link"
        label={translate('partner.invite.cancel')}
        loading={cancel.isPending}
        onPress={confirmCancel}
        testID="partner-invite-cancel"
      />
    </>
  );
}

/** No open invite yet: her name, then create one. */
function CreateInvite() {
  const [name, setName] = React.useState('');
  const create = useCreatePartnerInvite();
  return (
    <>
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
        label={translate('partner.invite.create_code')}
        loading={create.isPending}
        onPress={() => create.mutate({ display_name: name.trim() })}
        testID="partner-invite-create"
        className="mt-2 rounded-pill"
      />
      <ErrorBanner message={partnerErrorMessage(create.error)} />
    </>
  );
}

/** Her side, not yet linked. The open invite is read from the API, so it survives leaving the screen. */
export function InviteCard() {
  const { invite } = useOpenInvite();
  return (
    <View className="rounded-card bg-surface p-5" testID="partner-invite-card">
      <Text className="font-heading text-[20px] text-ink">
        {translate(
          invite ? 'partner.invite.share_title' : 'partner.invite.title'
        )}
      </Text>
      {invite ? <OpenInvite invite={invite} /> : <CreateInvite />}
    </View>
  );
}

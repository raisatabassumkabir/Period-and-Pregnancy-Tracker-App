import { Copy } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  useCancelPartnerInvite,
  useCreatePartnerInvite,
  useOpenInvite,
} from '@/api/sharing';
import type { PartnerInvite } from '@/api/types';
import { Button, ErrorBanner, Sparkle, Text } from '@/components/ui';
import {
  formatCalendarDate,
  toDateString,
  usePersonalizationProfile,
} from '@/lib/health';
import { translate } from '@/lib/i18n';
import {
  copyText,
  partnerErrorMessage,
  sendOnWhatsApp,
  shareText,
} from '@/lib/partner';
import { usePaletteColors } from '@/lib/theme';

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

/** The code on a dashed "ticket", the link with a copy button, and when it expires. */
function CodeBox({ invite }: { invite: PartnerInvite }) {
  const palette = usePaletteColors();
  const expires = formatCalendarDate(toDateString(new Date(invite.expires_at)));
  return (
    <View
      testID="partner-invite-code-box"
      className="mt-4 items-center overflow-hidden rounded-[30px] bg-accent-100 px-5 pb-5 pt-6"
    >
      <View className="absolute left-6 top-6">
        <Sparkle size={20} />
      </View>
      <Text className="font-body-bold text-[14px] text-accent-700">
        {translate('partner.invite.code_label')}
      </Text>
      <View className="mt-3 rounded-[18px] border-2 border-dashed border-accent-300 bg-surface px-5 py-3">
        <Text
          selectable
          className="font-display text-[28px] tracking-[2px] text-ink"
          testID="partner-invite-code"
        >
          {invite.code}
        </Text>
      </View>
      <View className="mt-4 h-[52px] w-full flex-row items-center overflow-hidden gap-2 rounded-2xl bg-surface pl-3.5 pr-1.5">
        {/* Android drops numberOfLines on selectable text; Copy covers it. */}
        <Text
          numberOfLines={1}
          ellipsizeMode="middle"
          className="flex-1 font-body-bold text-[13px] text-tone-600"
          testID="partner-invite-url"
        >
          {invite.url}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('partner.invite.copy_link')}
          onPress={() =>
            copyLink(invite).catch(() =>
              warn(translate('partner.invite.share_failed'))
            )
          }
          testID="partner-invite-copy"
          className="h-9 flex-row items-center gap-1.5 rounded-xl bg-accent-100 px-3 active:opacity-80"
        >
          <Copy size={ICON_SIZE} color={palette.accentScale[700]} />
          <Text className="font-body-bold text-[13px] text-accent-700">
            {translate('partner.invite.copy_link')}
          </Text>
        </Pressable>
      </View>
      <Text className="mt-3 font-body-bold text-[13px] text-accent-700">
        {translate('partner.invite.works_once', { date: expires })}
      </Text>
    </View>
  );
}

function Chip({ label, shared }: { label: string; shared: boolean }) {
  return (
    <View
      className={`h-8 justify-center rounded-pill px-3.5 ${
        shared
          ? 'bg-accent-100 border border-accent-300'
          : 'bg-tone-200 border border-tone-300'
      }`}
    >
      <Text
        className={`font-body-bold text-[13px] ${
          shared ? 'text-accent-700' : 'text-tone-700'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

/** Spells out exactly what her partner gets, and what never leaves her phone. */
function VisibilityCard() {
  const shared = ['see_phase', 'see_dates', 'see_fertile'] as const;
  const never = ['never_symptoms', 'never_moods', 'never_notes'] as const;
  return (
    <View
      className="mt-4 gap-3.5 rounded-[24px] border border-accent-200/60 bg-surface p-5 shadow-sm overflow-hidden"
      testID="partner-invite-visibility"
    >
      <Text className="font-display text-[19px] text-ink">
        {translate('partner.invite.see_title')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {shared.map((key) => (
          <Chip key={key} label={translate(`partner.invite.${key}`)} shared />
        ))}
      </View>
      <Text className="mt-1 font-body-bold text-[14px] text-tone-600">
        {translate('partner.invite.never_title')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {never.map((key) => (
          <Chip
            key={key}
            label={translate(`partner.invite.${key}`)}
            shared={false}
          />
        ))}
      </View>
    </View>
  );
}

function ShareButtons({ invite }: { invite: PartnerInvite }) {
  const message = inviteMessage(invite);
  const failed = () => warn(translate('partner.invite.share_failed'));
  return (
    <View className="mt-4 gap-2">
      <Button
        size="lg"
        label={translate('partner.invite.send_code')}
        onPress={() => sendOnWhatsApp(message).catch(failed)}
        testID="partner-invite-whatsapp"
        className="my-0 h-14 rounded-pill"
      />
      <Button
        variant="outline"
        size="lg"
        label={translate('partner.invite.share')}
        onPress={() => shareText(message).catch(failed)}
        testID="partner-invite-share"
        className="my-0 h-14 rounded-pill border-2"
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
      <Text className="mt-2 text-[16px] leading-[23px] text-tone-600">
        {translate('partner.invite.share_body')}
      </Text>
      <CodeBox invite={invite} />
      <ShareButtons invite={invite} />
      <VisibilityCard />
      <ErrorBanner
        message={partnerErrorMessage(create.error ?? cancel.error)}
      />
      <Text className="mt-4 text-center text-[12px] text-tone-600">
        {translate('partner.invite.pull_to_refresh')}
      </Text>
      <Button
        variant="link"
        label={translate('partner.invite.new_code')}
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

/**
 * Every user gets their own code without asking for one: when she has no open
 * invite (first visit, or the last one was used, cancelled or expired), a
 * fresh one is created. The server only ever keeps one open code per person.
 */
function useEnsureInvite() {
  const { invite, settled } = useOpenInvite();
  const { profile } = usePersonalizationProfile();
  const create = useCreatePartnerInvite();
  const { mutate } = create;
  const firstName = profile.fullName.trim().split(' ')[0] ?? '';
  const shouldCreate = settled && !invite && create.isIdle;
  React.useEffect(() => {
    if (shouldCreate) mutate({ display_name: firstName });
  }, [shouldCreate, mutate, firstName]);
  const retry = () => mutate({ display_name: firstName });
  return { invite, create, retry };
}

function PreparingInvite(props: {
  failed: Parameters<typeof partnerErrorMessage>[0];
  retry: () => void;
  isPending: boolean;
}) {
  const palette = usePaletteColors();
  if (props.failed) {
    return (
      <View className="mt-4" testID="partner-invite-failed">
        <ErrorBanner message={partnerErrorMessage(props.failed)} />
        <Button
          label={translate('partner.invite.retry')}
          loading={props.isPending}
          onPress={props.retry}
          testID="partner-invite-retry"
          className="mt-2 rounded-pill"
        />
      </View>
    );
  }
  return (
    <View
      className="mt-4 h-40 items-center justify-center gap-3 rounded-panel bg-accent-100"
      testID="partner-invite-preparing"
    >
      <ActivityIndicator color={palette.accent} />
      <Text className="text-[13px] text-tone-600">
        {translate('partner.invite.preparing')}
      </Text>
    </View>
  );
}

function InviteHeader({ hasInvite }: { hasInvite: boolean }) {
  return (
    <Text className="font-display text-[28px] leading-[34px] text-ink">
      {translate(
        hasInvite ? 'partner.invite.share_title' : 'partner.invite.title'
      )}
    </Text>
  );
}

/** Her side, not yet linked: her own code and link, ready to send. */
export function InviteCard() {
  const { invite, create, retry } = useEnsureInvite();
  return (
    <View testID="partner-invite-card">
      <InviteHeader hasInvite={!!invite} />
      {invite ? (
        <OpenInvite invite={invite} />
      ) : (
        <PreparingInvite
          failed={create.error}
          retry={retry}
          isPending={create.isPending}
        />
      )}
    </View>
  );
}

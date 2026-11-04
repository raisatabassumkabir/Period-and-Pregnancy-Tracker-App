import type { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { useRedeemPartnerCode } from '@/api/sharing';
import type { ProblemDetail } from '@/api/types';
import { Button, Input, Text } from '@/components/ui';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { extractPartnerCode, usePendingPartnerCode } from '@/lib/partner';

const NAME_MAX_LENGTH = 40;
/** Room for a pasted link or her whole message; only the code is sent. */
const INPUT_MAX_LENGTH = 500;
const WELCOME_ROUTE = '/partner-welcome';

const ERROR_BY_STATUS: Readonly<Record<number, TxKeyPath>> = {
  404: 'partner.join.invalid',
  409: 'partner.join.conflict',
  422: 'partner.join.own_code',
  429: 'partner.join.too_many',
};

/** Branch on the status (CONTRACT.md), never on the server's wording. */
function errorKey(error: AxiosError<ProblemDetail> | null): TxKeyPath | null {
  if (!error) return null;
  // No response: offline, or the server is down. Say so instead of "invalid".
  if (!error.response) return 'partner.network_error';
  return ERROR_BY_STATUS[error.response.status] ?? 'partner.generic_error';
}

/** Her link, the code, or the code pre-filled from an invite link the partner tapped. */
function useLinkOrCodeInput() {
  const pending = usePendingPartnerCode((state) => state.code);
  const hydrate = usePendingPartnerCode((state) => state.hydrate);
  const [text, setText] = React.useState('');
  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  React.useEffect(() => {
    if (pending) setText(pending);
  }, [pending]);
  return { text, setText, code: extractPartnerCode(text) };
}

/** Pastel number dots for the three "how it works" steps. */
const HOW_STEPS = [
  { key: 'partner.join.how_1', dot: 'bg-accent-100', ink: 'text-accent-700' },
  { key: 'partner.join.how_2', dot: 'bg-peach', ink: 'text-peach-ink' },
  { key: 'partner.join.how_3', dot: 'bg-mint', ink: 'text-mint-ink' },
] as const;

function HowItWorks() {
  return (
    <View className="mt-6 gap-3 px-1" testID="partner-join-how">
      <Text className="font-display text-[19px] text-ink">
        {translate('partner.join.how_title')}
      </Text>
      {HOW_STEPS.map((step, index) => (
        <View key={step.key} className="flex-row items-start gap-3">
          <View
            className={`size-7 items-center justify-center rounded-full ${step.dot}`}
          >
            <Text className={`font-body-bold text-[14px] ${step.ink}`}>
              {index + 1}
            </Text>
          </View>
          <Text className="flex-1 text-[15px] leading-[22px] text-ink">
            {translate(step.key)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Partner side: paste her link (or type her code) and link up. */
export function JoinCard() {
  const router = useRouter();
  const clearPending = usePendingPartnerCode((state) => state.clear);
  const { text, setText, code } = useLinkOrCodeInput();
  const [name, setName] = React.useState('');
  const redeem = useRedeemPartnerCode({
    onSuccess: () => {
      clearPending();
      showMessage({
        message: translate('partner.join.success'),
        type: 'success',
      });
      // "You're paired with her", a short intro, then their goals.
      router.push(WELCOME_ROUTE);
    },
  });

  const typedSomething = text.trim().length > 0;
  const failure: TxKeyPath | null =
    typedSomething && !code ? 'partner.join.no_code' : errorKey(redeem.error);

  return (
    <View testID="partner-join-card">
      <Text className="font-display text-[28px] leading-[34px] text-ink">
        {translate('partner.join.title')}
      </Text>
      <Text className="mt-2 text-[16px] leading-[23px] text-tone-600">
        {translate('partner.join.body')}
      </Text>
      <View className="mt-4 rounded-[30px] bg-accent2-100 p-5">
        <Input
          label={translate('partner.join.code_or_link')}
          value={text}
          onChangeText={setText}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={INPUT_MAX_LENGTH}
          error={failure ? translate(failure) : undefined}
          testID="partner-join-code"
        />
        {code && code !== text.trim().toUpperCase() ? (
          <Text
            className="mb-3 font-body-bold text-[14px] text-mint-ink"
            testID="partner-join-found"
          >
            {translate('partner.invite.code_label')}: {code}
          </Text>
        ) : null}
        <Input
          label={translate('partner.join.your_name')}
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX_LENGTH}
          testID="partner-join-name"
        />
        <Button
          variant="partner"
          size="lg"
          label={translate('partner.join.submit')}
          loading={redeem.isPending}
          disabled={!code}
          onPress={() =>
            code && redeem.mutate({ code, display_name: name.trim() })
          }
          testID="partner-join-submit"
          className="my-0 h-14 rounded-pill"
        />
      </View>
      <HowItWorks />
    </View>
  );
}

import type { AxiosError } from 'axios';
import React from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { useRedeemPartnerCode } from '@/api/sharing';
import type { ProblemDetail } from '@/api/types';
import { Button, Input, Text } from '@/components/ui';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { usePendingPartnerCode } from '@/lib/partner';

const NAME_MAX_LENGTH = 40;
const CODE_MAX_LENGTH = 14;

const ERROR_BY_STATUS: Readonly<Record<number, TxKeyPath>> = {
  404: 'partner.join.invalid',
  409: 'partner.join.conflict',
  422: 'partner.join.own_code',
  429: 'partner.join.too_many',
};

/** Branch on the status (CONTRACT.md), never on the server's wording. */
function errorKey(error: AxiosError<ProblemDetail> | null): TxKeyPath | null {
  const status = error?.response?.status;
  if (status === undefined) return error ? 'partner.join.invalid' : null;
  return ERROR_BY_STATUS[status] ?? 'partner.join.invalid';
}

/** Partner side: enter her code (pre-filled from an invite link) and link up. */
export function JoinCard() {
  const pending = usePendingPartnerCode((state) => state.code);
  const hydrate = usePendingPartnerCode((state) => state.hydrate);
  const clearPending = usePendingPartnerCode((state) => state.clear);
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const redeem = useRedeemPartnerCode({
    onSuccess: () => {
      clearPending();
      showMessage({
        message: translate('partner.join.success'),
        type: 'success',
      });
    },
  });

  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  React.useEffect(() => {
    if (pending) setCode(pending);
  }, [pending]);

  const failure = errorKey(redeem.error);
  return (
    <View className="rounded-card bg-surface p-5" testID="partner-join-card">
      <Text className="font-heading text-[20px] text-ink">
        {translate('partner.join.title')}
      </Text>
      <Text className="mt-2 text-[14px] leading-5 text-tone-700">
        {translate('partner.join.body')}
      </Text>
      <View className="mt-4">
        <Input
          placeholder={translate('partner.join.code_placeholder')}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={CODE_MAX_LENGTH}
          error={failure ? translate(failure) : undefined}
          testID="partner-join-code"
        />
        <Input
          label={translate('partner.join.your_name')}
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX_LENGTH}
          testID="partner-join-name"
        />
      </View>
      <Button
        label={translate('partner.join.submit')}
        loading={redeem.isPending}
        disabled={code.trim().length === 0}
        onPress={() =>
          redeem.mutate({ code: code.trim(), display_name: name.trim() })
        }
        testID="partner-join-submit"
        className="mt-2 rounded-pill"
      />
    </View>
  );
}

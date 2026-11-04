import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { Button, Pressable, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import type { SupportTopic } from '@/lib/partner';
import { kindMessageKey, sendOnWhatsApp, supportIdeaKey } from '@/lib/partner';

const ACTION_COUNT = 3;
const CHECK_SIZE = 14;
const CHECK_STROKE = 3;

function ActionRow(props: {
  label: string;
  done: boolean;
  onPress: () => void;
}) {
  const { label, done, onPress } = props;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      onPress={onPress}
      className="min-h-[52px] flex-row items-center gap-3 rounded-[18px] bg-accent2-100/60 px-4 py-3 active:opacity-80"
    >
      <View
        className={`size-6 items-center justify-center rounded-md border-2 ${
          done ? 'border-accent2 bg-accent2' : 'border-accent2-300 bg-surface'
        }`}
      >
        {done ? (
          <Check size={CHECK_SIZE} color="white" strokeWidth={CHECK_STROKE} />
        ) : null}
      </View>
      <Text
        className={`flex-1 font-body-bold text-[15px] leading-5 ${
          done ? 'text-tone-600 line-through' : 'text-ink'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Today's three small ways to help, ticked off as he does them. */
export function SupportActionsCard({ topic }: { topic: SupportTopic }) {
  const today = new Date();
  const [done, setDone] = React.useState<readonly number[]>([]);
  const toggle = (index: number) =>
    setDone((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index]
    );
  const actions = Array.from({ length: ACTION_COUNT }, (_, index) =>
    translate(supportIdeaKey(topic, today, index))
  );
  return (
    <View
      className="rounded-[28px] border-2 border-accent2-200 bg-surface p-5"
      testID="partner-support-card"
    >
      <Text className="font-display text-[21px] leading-[27px] text-ink">
        {translate('partner.home.actions_title')}
      </Text>
      <View className="mt-3 gap-2" testID="partner-support-idea">
        {actions.map((label, index) => (
          <ActionRow
            key={label}
            label={label}
            done={done.includes(index)}
            onPress={() => toggle(index)}
          />
        ))}
      </View>
    </View>
  );
}

/** A ready-made kind message to send her, with another on tap. */
export function KindNoteCard({ topic }: { topic: SupportTopic }) {
  const [skip, setSkip] = React.useState(0);
  const message = translate(kindMessageKey(topic, new Date(), skip));
  const send = () =>
    sendOnWhatsApp(message).catch(() =>
      showMessage({
        message: translate('partner.invite.share_failed'),
        type: 'warning',
      })
    );
  return (
    <View className="rounded-[28px] bg-peach p-5" testID="partner-kind-note">
      <Text className="font-display text-[21px] leading-[27px] text-ink">
        {translate('partner.home.note_title')}
      </Text>
      <View className="mt-3 rounded-[18px] rounded-bl-[4px] bg-surface p-4">
        <Text className="text-[16px] leading-6 text-ink">{message}</Text>
      </View>
      <Button
        variant="partner"
        label={translate('partner.invite.send_code')}
        onPress={send}
        testID="partner-send-message"
        className="mt-4 rounded-pill"
      />
      <Button
        variant="link"
        label={translate('partner.home.another_idea')}
        onPress={() => setSkip((value) => value + 1)}
        testID="partner-another-idea"
      />
    </View>
  );
}

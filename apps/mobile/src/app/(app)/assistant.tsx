import { FlashList } from '@shopify/flash-list';
import React from 'react';

import { MessageBubble, SuggestionChips } from '@/components/assistant';
import {
  Button,
  FocusAwareStatusBar,
  Input,
  Pill,
  SafeAreaView,
  ScreenHeader,
  View,
} from '@/components/ui';
import type { ChatMessage } from '@/lib/assistant/use-assistant-chat';
import { useAssistantChat } from '@/lib/assistant/use-assistant-chat';

const ESTIMATED_ITEM_SIZE = 72;

const SUGGESTIONS = [
  'When is my next period?',
  'How far along am I?',
  'What symptoms have I logged?',
  'How many kicks today?',
] as const;

// FlashList only accepts padding/backgroundColor in `contentContainerStyle`
// and warns on `style`; sizing comes from wrapping it in a flexed View below.
const LIST_CONTENT_STYLE = { paddingHorizontal: 16, paddingVertical: 12 };

function renderMessage({ item }: { item: ChatMessage }) {
  return <MessageBubble role={item.role} text={item.text} />;
}

function keyExtractor(item: ChatMessage): string {
  return item.id;
}

/** Fully offline, rule-based Q&A over the user's own (or demo) health data. */
export default function Assistant() {
  const { messages, send, isSending, context } = useAssistantChat();
  const [draft, setDraft] = React.useState('');

  const handleSend = async () => {
    const question = draft;
    setDraft('');
    await send(question);
  };

  return (
    <View className="flex-1 bg-canvas" testID="assistant-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-3">
          <ScreenHeader title="Assistant" />
          <View className="mt-2 flex-row gap-2">
            <Pill label="On-device guide" tone="accent2-soft" />
            {context.isDemoData && <Pill label="Demo data" />}
          </View>
        </View>
      </SafeAreaView>

      <View className="flex-1">
        <FlashList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          estimatedItemSize={ESTIMATED_ITEM_SIZE}
          contentContainerStyle={LIST_CONTENT_STYLE}
          testID="assistant-messages"
        />
      </View>

      <View className="px-4 pb-2">
        <SuggestionChips suggestions={SUGGESTIONS} onPick={setDraft} />
      </View>

      <View className="flex-row items-end gap-2 border-t border-divider px-4 py-3">
        <View className="flex-1">
          <Input
            testID="assistant-input"
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask a question…"
          />
        </View>
        <Button
          label="Send"
          onPress={handleSend}
          loading={isSending}
          disabled={draft.trim().length === 0}
          testID="assistant-send"
        />
      </View>
    </View>
  );
}

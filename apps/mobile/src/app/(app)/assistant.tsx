import { FlashList } from '@shopify/flash-list';
import { SendHorizontal } from 'lucide-react-native';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';

import {
  MessageBubble,
  SuggestionChips,
  TypingIndicator,
} from '@/components/assistant';
import {
  FocusAwareStatusBar,
  Pill,
  SafeAreaView,
  View,
} from '@/components/ui';
import { AppHeader } from '@/components/ui/app-header';
import type { ChatMessage } from '@/lib/assistant/use-chat';
import { useChat } from '@/lib/assistant/use-chat';

const ESTIMATED_ITEM_SIZE = 72;

const SUGGESTIONS = [
  'When is my next period?',
  'How far along am I?',
  'What symptoms have I logged?',
  'How many kicks today?',
] as const;

const LIST_CONTENT_STYLE = { paddingHorizontal: 16, paddingVertical: 12 };

function renderMessage({ item }: { item: ChatMessage }) {
  return <MessageBubble role={item.role} text={item.text} />;
}

function keyExtractor(item: ChatMessage): string {
  return item.id;
}

export default function Assistant() {
  const { messages, send, isSending } = useChat();
  const [draft, setDraft] = React.useState('');

  const canSend = draft.trim().length > 0 && !isSending;

  const handleSend = async () => {
    if (!canSend) return;
    const question = draft;
    setDraft('');
    await send(question);
  };

  return (
    <View className="flex-1 bg-canvas" testID="assistant-screen">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']}>
        <View className="px-4 pt-2">
          <AppHeader title="Assistant" />
          <View className="mt-2 flex-row gap-2">
            <Pill label="AI Health Guide" tone="accent2-soft" />
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        <View className="flex-1">
          <FlashList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            estimatedItemSize={ESTIMATED_ITEM_SIZE}
            contentContainerStyle={LIST_CONTENT_STYLE}
            ListFooterComponent={isSending ? <TypingIndicator /> : null}
            testID="assistant-messages"
          />
        </View>

        <View className="px-4 pb-2">
          <SuggestionChips suggestions={SUGGESTIONS} onPick={setDraft} />
        </View>

        {/* Fixed Chat Input Bar */}
        <View className="border-t border-divider px-4 py-3 bg-canvas">
          <View
            style={{
              backgroundColor: '#FCF8F5',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#F0E5E1',
              flexDirection: 'row',
              alignItems: 'center',
              paddingRight: 6,
              paddingLeft: 4,
            }}
          >
            <TextInput
              testID="assistant-input"
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask a question…"
              placeholderTextColor="#A89B97"
              multiline={true}
              style={{
                flex: 1,
                minHeight: 50,
                maxHeight: 120,
                paddingHorizontal: 20,
                paddingVertical: 12,
                fontSize: 15,
                color: '#2A2321',
                textAlignVertical: 'center',
              }}
            />
            <Pressable
              testID="assistant-send"
              accessibilityRole="button"
              accessibilityLabel="Send question"
              onPress={handleSend}
              disabled={!canSend}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#FF9FA8',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canSend ? 1 : 0.45,
              }}
            >
              <SendHorizontal size={20} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

import React from 'react';

import { Text, View } from '@/components/ui';

interface Props {
  role: 'user' | 'assistant';
  text: string;
}

const BUBBLE_BASE = 'mb-2 max-w-[85%] rounded-2xl px-4 py-2.5';

/** One chat turn — right-aligned accent bubble for the user, left for the guide. */
export function MessageBubble({ role, text }: Props) {
  const isUser = role === 'user';

  return (
    <View
      testID={`assistant-message-${role}`}
      className={`${BUBBLE_BASE} ${
        isUser ? 'self-end bg-accent' : 'self-start bg-surface'
      }`}
    >
      <Text className={isUser ? 'text-accent-100' : 'text-ink'}>{text}</Text>
    </View>
  );
}

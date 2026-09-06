import React from 'react';

import { Pressable, Text, View } from '@/components/ui';

interface Props {
  suggestions: readonly string[];
  onPick: (question: string) => void;
}

/** Tappable example questions, wrapped into rows above the composer. */
export function SuggestionChips({ suggestions, onPick }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2" testID="suggestion-chips">
      {suggestions.map((suggestion, index) => (
        <Pressable
          key={suggestion}
          accessibilityRole="button"
          testID={`suggestion-chip-${index}`}
          onPress={() => onPick(suggestion)}
          className="rounded-full bg-tone-200 px-3 py-1.5"
        >
          <Text className="text-[13px] text-ink">{suggestion}</Text>
        </Pressable>
      ))}
    </View>
  );
}

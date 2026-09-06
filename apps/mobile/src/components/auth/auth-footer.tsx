import { Link } from 'expo-router';
import React from 'react';

import { Pressable, Text, View } from '@/components/ui';

interface Props {
  question: string;
  linkLabel: string;
  href: '/login' | '/register';
  testID?: string;
}

/** "Don't have an account? Register" — the cross-link between auth screens. */
export function AuthFooter({ question, linkLabel, href, testID }: Props) {
  return (
    <View className="flex-row items-center justify-center">
      <Text className="text-[15px] text-tone-700">{question} </Text>
      <Link href={href} asChild>
        <Pressable accessibilityRole="button" testID={testID}>
          <Text className="font-body-bold text-[15px] text-accent-700">
            {linkLabel}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

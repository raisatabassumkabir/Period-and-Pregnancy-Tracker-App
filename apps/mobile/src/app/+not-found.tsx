import { Link, Stack } from 'expo-router';

import { Text, View } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-canvas p-4">
        <Text className="mb-4 font-heading text-2xl text-ink">
          This screen doesn&apos;t exist.
        </Text>

        <Link href="/" className="mt-4">
          <Text className="text-accent-700 underline">Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

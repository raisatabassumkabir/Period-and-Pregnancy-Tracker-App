import React from 'react';

import { Text, View } from '@/components/ui';

interface Props {
  title: string;
  body?: string;
}

/** Big serif question plus a soft line under it, shared by the partner steps. */
export function PartnerStepHeading({ title, body }: Props) {
  return (
    <View className="mb-6">
      <Text className="font-display text-[29px] leading-[36px] text-ink">
        {title}
      </Text>
      {body ? (
        <Text className="mt-2.5 text-[16px] leading-[23px] text-tone-600">
          {body}
        </Text>
      ) : null}
    </View>
  );
}

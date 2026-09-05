import React from 'react';

import { Kicker, View } from '@/components/ui';
import type { TxKeyPath } from '@/lib';
import { translate } from '@/lib';

type Props = {
  children: React.ReactNode;
  title?: TxKeyPath;
};

/**
 * A settings section: an accent kicker over one `rounded-card` surface.
 *
 * Separators are drawn here, between rows, instead of by each row — a row that
 * carried its own bottom border would leave a hairline floating against the
 * card's rounded bottom edge.
 */
export const ItemsContainer = ({ children, title }: Props) => {
  const rows = React.Children.toArray(children);

  return (
    <View className="mt-6">
      {title && (
        <View className="mb-2 px-1">
          <Kicker>{translate(title)}</Kicker>
        </View>
      )}
      <View className="overflow-hidden rounded-card bg-surface">
        {rows.map((row, index) => (
          // `React.Children.toArray` stamps a stable key onto every valid
          // element, so this never depends on the index staying put.
          <View
            key={React.isValidElement(row) ? row.key : index}
            className={index === 0 ? undefined : 'border-t border-divider'}
          >
            {row}
          </View>
        ))}
      </View>
    </View>
  );
};

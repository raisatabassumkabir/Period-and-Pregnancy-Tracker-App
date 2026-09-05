import React from 'react';

import { Text } from './text';

/**
 * Uppercase section label placed above a block ("Get started", "Account").
 * Accent by default; `muted` is the neutral variant for use inside cards,
 * where the accent would compete with the card's own accent content.
 */
export function Kicker({
  children,
  muted = false,
}: {
  children: string;
  muted?: boolean;
}) {
  return (
    <Text
      className={`font-body-bold text-[11px] uppercase tracking-widest ${
        muted ? 'text-tone-700' : 'text-accent-700'
      }`}
    >
      {children}
    </Text>
  );
}

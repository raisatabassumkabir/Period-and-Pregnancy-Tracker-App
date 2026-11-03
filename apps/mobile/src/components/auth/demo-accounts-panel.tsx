import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import React from 'react';

import { Pressable, Text, View } from '@/components/ui';
import type { DemoUserAccount } from '@/lib/auth/demo-users';
import { CLEAN_TEST_ACCOUNTS, DEMO_ACCOUNTS } from '@/lib/auth/demo-users';
import { usePaletteColors } from '@/lib/theme';

const ICON_SIZE = 16;

interface Props {
  onSelect: (email: string, password: string) => void;
}

interface RowProps {
  account: Pick<DemoUserAccount, 'email' | 'password' | 'name' | 'badge'>;
  testID: string;
  onSelect: Props['onSelect'];
}

function AccountRow({ account, testID, onSelect }: RowProps) {
  return (
    <Pressable
      onPress={() => onSelect(account.email, account.password)}
      className="flex-row items-center justify-between rounded-panel bg-canvas px-3 py-2.5 active:opacity-80"
      testID={testID}
    >
      <View className="flex-1 pr-2">
        <Text className="font-body-bold text-[13px] text-ink">
          {account.name}
        </Text>
        <Text className="text-[11px] text-tone-600" numberOfLines={1}>
          {account.email}
        </Text>
      </View>
      <View className="rounded-pill bg-accent-100 px-2 py-0.5">
        <Text className="text-[10px] font-bold text-accent-700">
          {account.badge}
        </Text>
      </View>
    </Pressable>
  );
}

function badgeTestID(badge: string): string {
  return `demo-account-${badge.toLowerCase().replace(/\s+/g, '-')}`;
}

/** Dev builds only: tap an account to fill the form. Collapsed so it never crowds the screen. */
export function DemoAccountsPanel({ onSelect }: Props) {
  const palette = usePaletteColors();
  const [open, setOpen] = React.useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <View className="mt-8 rounded-card border border-dashed border-divider p-3">
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((value) => !value)}
        className="flex-row items-center gap-1.5"
        testID="demo-accounts-toggle"
      >
        <Sparkles size={ICON_SIZE} color={palette.accent} />
        <Text className="flex-1 font-body-bold text-[13px] text-ink">
          Demo & test accounts
        </Text>
        <Chevron size={ICON_SIZE} color={palette.tone[500]} />
      </Pressable>
      {open ? (
        <View className="mt-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <AccountRow
              key={account.email}
              account={account}
              onSelect={onSelect}
              testID={badgeTestID(account.badge)}
            />
          ))}
          {CLEAN_TEST_ACCOUNTS.map((account) => (
            <AccountRow
              key={account.email}
              account={account}
              onSelect={onSelect}
              testID={`clean-account-${account.email.split('@')[0]}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

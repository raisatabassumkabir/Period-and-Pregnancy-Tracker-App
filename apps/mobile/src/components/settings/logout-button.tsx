import { LogOut } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator } from 'react-native';

import { useLogout } from '@/api/auth/use-logout';
import { colors as legacyColors, Pressable, Text } from '@/components/ui';
import { translate, useAuth } from '@/lib';

const ICON_SIZE = 18;

export const LogoutButton = () => {
  const signOut = useAuth.use.signOut();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Signing out locally is the point; a failed server call must not trap
      // the user in a session they asked to leave.
    }
    signOut();
  };

  return (
    <Pressable
      accessibilityRole="button"
      testID="settings-logout"
      onPress={handleLogout}
      disabled={logoutMutation.isPending}
      className="mt-8 flex-row items-center justify-center gap-2 rounded-card bg-surface py-4 active:opacity-80"
    >
      {logoutMutation.isPending ? (
        <ActivityIndicator size="small" color={legacyColors.danger[500]} />
      ) : (
        <>
          <LogOut size={ICON_SIZE} color={legacyColors.danger[500]} />
          <Text className="font-body-bold text-[15px] text-danger-500">
            {translate('settings.logout')}
          </Text>
        </>
      )}
    </Pressable>
  );
};

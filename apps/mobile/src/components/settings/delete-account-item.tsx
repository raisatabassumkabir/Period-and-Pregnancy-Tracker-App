import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { useDeleteAccount } from '@/api/auth/use-delete-account';
import { colors } from '@/components/ui';
import { translate, useAuth } from '@/lib';

import { Item } from './item';

const ICON_SIZE = 20;

export const DeleteAccountItem = () => {
  const signOut = useAuth.use.signOut();
  const queryClient = useQueryClient();
  const deleteAccount = useDeleteAccount();

  const performDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
    } catch (e) {
      showMessage({
        message: translate('settings.delete_account.failed'),
        description: e instanceof Error ? e.message : undefined,
        type: 'danger',
      });
      return;
    }
    queryClient.clear();
    signOut();
    showMessage({
      message: translate('settings.delete_account.done'),
      type: 'success',
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      translate('settings.delete_account.title'),
      translate('settings.delete_account.message'),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('settings.delete_account.confirm'),
          style: 'destructive',
          onPress: () => void performDelete(),
        },
      ]
    );
  };

  return (
    <Item
      text="settings.delete_account.title"
      icon={<Trash2 size={ICON_SIZE} color={colors.danger[600]} />}
      onPress={deleteAccount.isPending ? undefined : confirmDelete}
      isDestructive
    />
  );
};

import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { useDeleteAccount } from '@/api/auth/use-delete-account';
import { colors } from '@/components/ui';
import { translate, useAuth } from '@/lib';
import { clear as clearPreferenceStore } from '@/lib/storage';
import { EncryptedHealthStorage } from '@/lib/storage/encrypted-storage';

import { Item } from './item';

const ICON_SIZE = 20;

// The server copy is already gone at this point; a local wipe failing must
// not keep the user signed in to a deleted account, so warn and carry on.
const warnLocalWipeFailed = (store: string) => (error: unknown) =>
  console.warn(`Account deleted, but clearing ${store} failed`, error);

/**
 * Health data lives in two on-device stores: the AES-GCM health store and the
 * MMKV preference store (local daily logs, kick counts, discharge logs and the
 * personalization profile with medical conditions). Both are per-user, so
 * deleting the account wipes both.
 */
async function wipeLocalUserData(): Promise<void> {
  await EncryptedHealthStorage.purgeAllHealthData().catch(
    warnLocalWipeFailed('the health store')
  );
  await clearPreferenceStore().catch(
    warnLocalWipeFailed('the preference store')
  );
}

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
    await wipeLocalUserData();
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

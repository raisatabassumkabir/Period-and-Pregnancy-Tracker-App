import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Alert } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import * as deleteHook from '@/api/auth/use-delete-account';
import { signIn, useAuth } from '@/lib/auth';
import { cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import { DeleteAccountItem } from './delete-account-item';

type AlertButton = { text?: string; style?: string; onPress?: () => void };

const pressDestructiveButton = () => {
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as AlertButton[];
  const destructive = buttons.find((b) => b.style === 'destructive');
  destructive?.onPress?.();
};

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const mockDeleteHook = (mutateAsync: jest.Mock) =>
  jest.spyOn(deleteHook, 'useDeleteAccount').mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof deleteHook.useDeleteAccount>);

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  signIn({ access: 'a', refresh: 'r' });
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe('DeleteAccountItem', () => {
  it('asks for confirmation before deleting', () => {
    const mutateAsync = jest.fn();
    mockDeleteHook(mutateAsync);
    wrap(<DeleteAccountItem />);

    fireEvent.press(screen.getByText('Delete account'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('deletes the account and signs out after confirmation', async () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    mockDeleteHook(mutateAsync);
    wrap(<DeleteAccountItem />);

    fireEvent.press(screen.getByText('Delete account'));
    pressDestructiveButton();

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useAuth.getState().status).toBe('signOut'));
    expect(showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' })
    );
  });

  it('keeps the session and reports failure when the request fails', async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error('boom'));
    mockDeleteHook(mutateAsync);
    wrap(<DeleteAccountItem />);

    fireEvent.press(screen.getByText('Delete account'));
    pressDestructiveButton();

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'danger', description: 'boom' })
      )
    );
    expect(useAuth.getState().status).toBe('signIn');
  });
});

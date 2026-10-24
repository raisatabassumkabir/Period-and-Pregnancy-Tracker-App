import React from 'react';

import { useForgotPassword } from '@/api/auth';
import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import ForgotPassword from './forgot-password';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => false }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/api/auth', () => ({
  useForgotPassword: jest.fn(),
}));

const mockedUseForgotPassword = useForgotPassword as unknown as jest.Mock;
const mutateAsync = jest.fn();

beforeEach(() => {
  mockedUseForgotPassword.mockReturnValue({ mutateAsync, isPending: false });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('ForgotPassword', () => {
  it('sends the trimmed email with an idempotency key and shows the inbox state', async () => {
    mutateAsync.mockResolvedValue({ detail: 'ok' });
    const { user } = setup(<ForgotPassword />);

    await user.type(screen.getByTestId('email-input'), '  maya@example.com ');
    await user.press(screen.getByTestId('send-reset-link-button'));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        email: 'maya@example.com',
        idempotencyKey: '00000000-0000-4000-8000-000000000000',
      })
    );
    expect(await screen.findByTestId('forgot-password-sent')).toBeOnTheScreen();
    expect(
      screen.getByText(/maya@example.com has an account/)
    ).toBeOnTheScreen();
  });

  it('validates the email before calling the API', async () => {
    const { user } = setup(<ForgotPassword />);

    await user.type(screen.getByTestId('email-input'), 'not-an-email');
    await user.press(screen.getByTestId('send-reset-link-button'));

    expect(await screen.findByText('Enter a valid email')).toBeOnTheScreen();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('shows the problem detail when the request is rate limited', async () => {
    mutateAsync.mockRejectedValue({
      response: {
        status: 429,
        data: {
          type: 'https://apiguide.dev/errors/rate-limit-exceeded',
          title: 'Rate Limit Exceeded',
          status: 429,
          detail: 'Request was throttled. Expected available in 3540 seconds.',
        },
      },
    });
    const { user } = setup(<ForgotPassword />);

    await user.type(screen.getByTestId('email-input'), 'maya@example.com');
    await user.press(screen.getByTestId('send-reset-link-button'));

    expect(await screen.findByText(/Request was throttled/)).toBeOnTheScreen();
    expect(screen.queryByTestId('forgot-password-sent')).toBeNull();
  });
});

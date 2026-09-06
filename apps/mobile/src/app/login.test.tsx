import React from 'react';

import { useLogin } from '@/api/auth';
import { useAuth } from '@/lib';
import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import Login from './login';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => false }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// SystemBars schedules native status-bar work that outlives the jest environment.
jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/api/auth', () => ({
  useLogin: jest.fn(),
}));

const mockedUseLogin = useLogin as unknown as jest.Mock;

const mutateAsync = jest.fn();

const mockLogin = (isPending = false) => {
  mockedUseLogin.mockReturnValue({ mutateAsync, isPending });
};

/** An axios-shaped rejection carrying an RFC 9457 problem body. */
const problem = (status: number, body: Record<string, unknown>) =>
  Object.assign(new Error('Request failed'), {
    response: { status, data: body },
  });

const TOKENS = { access: 'access-1', refresh: 'refresh-1' };

beforeEach(() => {
  useAuth.setState({ status: 'signOut', token: null });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('Login', () => {
  it('leads with the brand lockup and the log-in copy', () => {
    mockLogin();
    setup(<Login />);

    expect(screen.getByTestId('auth-brand')).toBeOnTheScreen();
    expect(screen.getByText('Happy Women')).toBeOnTheScreen();
    expect(screen.getByText('Welcome back')).toBeOnTheScreen();
    // "Log in" is both the screen title and the button label.
    expect(screen.getByTestId('login-button-label')).toHaveTextContent(
      'Log in'
    );
  });

  it('rejects a malformed email without calling the API', async () => {
    mockLogin();
    const { user } = setup(<Login />);

    await user.type(screen.getByTestId('email-input'), 'not-an-email');
    await user.type(screen.getByTestId('password-input'), 'whatever');
    await user.press(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email')).toBeOnTheScreen();
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('requires a password but never judges its strength', async () => {
    // An account made before the strength rules must still be able to log in.
    mockLogin();
    mutateAsync.mockResolvedValue(TOKENS);
    const { user } = setup(<Login />);

    await user.type(screen.getByTestId('email-input'), 'ada@example.com');
    await user.type(screen.getByTestId('password-input'), 'old');
    await user.press(screen.getByTestId('login-button'));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
  });

  it('stores the token pair and flips the auth store on success', async () => {
    mockLogin();
    mutateAsync.mockResolvedValue(TOKENS);
    const { user } = setup(<Login />);

    await user.type(screen.getByTestId('email-input'), '  ada@example.com ');
    await user.type(screen.getByTestId('password-input'), 'secret123');
    await user.press(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'secret123',
      });
    });
    // The root layout swaps the stacks off this state; the token itself goes
    // to expo-secure-store inside `signIn`.
    await waitFor(() => {
      expect(useAuth.getState().status).toBe('signIn');
    });
    expect(useAuth.getState().token).toEqual(TOKENS);
  });

  it('shows the problem detail from a rejected sign-in', async () => {
    mockLogin();
    mutateAsync.mockRejectedValue(
      problem(401, {
        type: 'https://apiguide.dev/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'No active account found with the given credentials.',
      })
    );
    const { user } = setup(<Login />);

    await user.type(screen.getByTestId('email-input'), 'ada@example.com');
    await user.type(screen.getByTestId('password-input'), 'wrong-password');
    await user.press(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(
        screen.getByText('No active account found with the given credentials.')
      ).toBeOnTheScreen();
    });
    expect(useAuth.getState().status).toBe('signOut');
  });

  it('pins a 422 field error to the field it names', async () => {
    mockLogin();
    mutateAsync.mockRejectedValue(
      problem(422, {
        type: 'https://apiguide.dev/errors/validation-error',
        title: 'Validation error',
        status: 422,
        detail: 'The submitted data is invalid.',
        errors: { email: ['That address is not registered.'] },
      })
    );
    const { user } = setup(<Login />);

    await user.type(screen.getByTestId('email-input'), 'ada@example.com');
    await user.type(screen.getByTestId('password-input'), 'secret123');
    await user.press(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(
        screen.getByText('That address is not registered.')
      ).toBeOnTheScreen();
    });
  });

  it('falls back to a readable message when the body is not a problem', async () => {
    mockLogin();
    mutateAsync.mockRejectedValue(new Error('Network Error'));
    const { user } = setup(<Login />);

    await user.type(screen.getByTestId('email-input'), 'ada@example.com');
    await user.type(screen.getByTestId('password-input'), 'secret123');
    await user.press(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Could not log in. Check your connection and try again.'
        )
      ).toBeOnTheScreen();
    });
  });

  it('shows a spinner and blocks re-submission while in flight', () => {
    mockLogin(true);
    setup(<Login />);

    expect(
      screen.getByTestId('login-button-activity-indicator')
    ).toBeOnTheScreen();
    expect(screen.getByTestId('login-button')).toBeDisabled();
  });
});

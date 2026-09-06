import React from 'react';

import { useLogin, useRegister } from '@/api/auth';
import { useAuth } from '@/lib';
import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import Register from './register';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => false }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-edge-to-edge', () => ({
  SystemBars: () => null,
}));

jest.mock('@/api/auth', () => ({
  useLogin: jest.fn(),
  useRegister: jest.fn(),
}));

const mockedUseLogin = useLogin as unknown as jest.Mock;
const mockedUseRegister = useRegister as unknown as jest.Mock;

const registerAsync = jest.fn();
const loginAsync = jest.fn();

const mockAuthApi = (isPending = false) => {
  mockedUseRegister.mockReturnValue({ mutateAsync: registerAsync, isPending });
  mockedUseLogin.mockReturnValue({ mutateAsync: loginAsync, isPending: false });
};

const problem = (status: number, body: Record<string, unknown>) =>
  Object.assign(new Error('Request failed'), {
    response: { status, data: body },
  });

const TOKENS = { access: 'access-1', refresh: 'refresh-1' };

const fillValidForm = async (user: ReturnType<typeof setup>['user']) => {
  await user.type(screen.getByTestId('email-input'), 'ada@example.com');
  await user.type(screen.getByTestId('password-input'), 'secret123');
  await user.type(screen.getByTestId('confirm-password-input'), 'secret123');
};

beforeEach(() => {
  useAuth.setState({ status: 'signOut', token: null });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('Register', () => {
  it('leads with the brand lockup and the create-account copy', () => {
    mockAuthApi();
    setup(<Register />);

    expect(screen.getByTestId('auth-brand')).toBeOnTheScreen();
    expect(screen.getByText('Create account')).toBeOnTheScreen();
  });

  it('ticks each password rule as it is satisfied', async () => {
    mockAuthApi();
    const { user } = setup(<Register />);

    expect(screen.getByTestId('password-rule-length-unmet')).toBeOnTheScreen();
    expect(screen.getByTestId('password-rule-number-unmet')).toBeOnTheScreen();

    await user.type(screen.getByTestId('password-input'), 'secret123');

    await waitFor(() => {
      expect(screen.getByTestId('password-rule-length-met')).toBeOnTheScreen();
    });
    expect(screen.getByTestId('password-rule-letter-met')).toBeOnTheScreen();
    expect(screen.getByTestId('password-rule-number-met')).toBeOnTheScreen();
  });

  it('blocks a password with no number', async () => {
    mockAuthApi();
    const { user } = setup(<Register />);

    await user.type(screen.getByTestId('email-input'), 'ada@example.com');
    await user.type(screen.getByTestId('password-input'), 'onlyletters');
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'onlyletters'
    );
    await user.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByText('Include at least one number')).toBeOnTheScreen();
    });
    expect(registerAsync).not.toHaveBeenCalled();
  });

  it('blocks a mismatched confirmation', async () => {
    mockAuthApi();
    const { user } = setup(<Register />);

    await user.type(screen.getByTestId('email-input'), 'ada@example.com');
    await user.type(screen.getByTestId('password-input'), 'secret123');
    await user.type(screen.getByTestId('confirm-password-input'), 'secret124');
    await user.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByText('Passwords must match')).toBeOnTheScreen();
    });
    expect(registerAsync).not.toHaveBeenCalled();
  });

  it('registers, logs straight in, and stores the token pair', async () => {
    mockAuthApi();
    registerAsync.mockResolvedValue({ id: 'user-1' });
    loginAsync.mockResolvedValue(TOKENS);
    const { user } = setup(<Register />);

    await fillValidForm(user);
    await user.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(registerAsync).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'secret123',
      });
    });
    // Registration returns the user, not tokens — hence the follow-up login.
    await waitFor(() => expect(loginAsync).toHaveBeenCalled());
    await waitFor(() => {
      expect(useAuth.getState().status).toBe('signIn');
    });
    expect(useAuth.getState().token).toEqual(TOKENS);
  });

  it('pins "already in use" to the email field', async () => {
    mockAuthApi();
    registerAsync.mockRejectedValue(
      problem(422, {
        type: 'https://apiguide.dev/errors/validation-error',
        title: 'Validation error',
        status: 422,
        detail: 'The submitted data is invalid.',
        errors: { email: ['Email already in use.'] },
      })
    );
    const { user } = setup(<Register />);

    await fillValidForm(user);
    await user.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByText('Email already in use.')).toBeOnTheScreen();
    });
    expect(loginAsync).not.toHaveBeenCalled();
    expect(useAuth.getState().status).toBe('signOut');
  });

  it('shows a spinner and blocks re-submission while in flight', () => {
    mockAuthApi(true);
    setup(<Register />);

    expect(
      screen.getByTestId('register-submit-activity-indicator')
    ).toBeOnTheScreen();
    expect(screen.getByTestId('register-submit')).toBeDisabled();
  });
});

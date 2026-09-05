import { create } from 'zustand';

import { resetTelemetryUser } from '../telemetry';
import { createSelectors } from '../utils';
import type { TokenType } from './utils';
import { getToken, removeToken, setToken } from './utils';

interface AuthState {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (data: TokenType) => void;
  signOut: () => void;
  hydrate: () => void;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: (token) => {
    setToken(token).catch(() => {
      // Ignore storage errors, still set the state
    });
    set({ status: 'signIn', token });
  },
  signOut: () => {
    removeToken().catch(() => {
      // Ignore storage errors, still set the state
    });
    resetTelemetryUser();
    set({ status: 'signOut', token: null });
  },
  hydrate: () => {
    // Dev mode: Just sign in immediately

    try {
      getToken()
        .then((userToken) => {
          if (userToken !== null) {
            get().signIn(userToken);
          } else {
            get().signOut();
          }
        })
        .catch((e) => {
          console.error('Error getting token:', e);
          get().signOut();
        });
    } catch (e) {
      console.error('Error in hydrate:', e);
      get().signOut();
    }
  },
}));

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (token: TokenType) => _useAuth.getState().signIn(token);
export const hydrateAuth = () => _useAuth.getState().hydrate();

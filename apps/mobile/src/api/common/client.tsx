import { Env } from '@env';
import axios from 'axios';

import { isPaymentRequiredProblem, toUpgradeDetail } from '@/api/billing/types';
import { getToken } from '@/lib/auth/utils';
import { showUpgrade } from '@/lib/upgrade';

export const client = axios.create({
  baseURL: Env.API_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token?.access) {
        config.headers.Authorization = `Bearer ${token.access}`;
      }
    } catch (error) {
      // If we can't get the token, continue without it
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      console.warn('Auth token is invalid or expired');
    } else if (status === 402) {
      // Every error is an RFC 9457 problem; the 402 one carries the paywall
      // fields as extension members (packages/api-contract/CONTRACT.md §402).
      const body = error.response?.data;
      if (isPaymentRequiredProblem(body)) {
        showUpgrade(toUpgradeDetail(body));
      } else {
        showUpgrade({
          message: 'Upgrade to Premium to unlock this feature.',
          feature: 'premium',
        });
      }
    }
    return Promise.reject(error);
  }
);

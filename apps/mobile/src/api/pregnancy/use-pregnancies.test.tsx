import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useAuth } from '@/lib/auth';
import { client } from '../common';
import type { PaginateQuery, Pregnancy } from '../types';
import { activePregnancy, usePregnancies } from './use-pregnancies';

jest.mock('../common', () => ({
  client: { get: jest.fn() },
}));

const mockedClient = client as jest.Mocked<typeof client>;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const pregnancy = (overrides: Partial<Pregnancy>): Pregnancy => ({
  id: 'pregnancy-1',
  lmp_date: null,
  due_date: '2026-10-08',
  status: 'completed',
  notes: '',
  current_week: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const page = (results: Pregnancy[]): PaginateQuery<Pregnancy> => ({
  results,
  count: results.length,
  next: null,
  previous: null,
});

describe('usePregnancies', () => {
  beforeEach(() => {
    useAuth.setState({
      status: 'signIn',
      token: { access: 'test-access', refresh: 'test-refresh' },
    });
  });

  it('reads the paginated pregnancies collection', async () => {
    mockedClient.get.mockResolvedValue({ data: page([]) });
    const { result } = renderHook(() => usePregnancies(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedClient.get).toHaveBeenCalledWith('pregnancies/');
  });
});

describe('activePregnancy', () => {
  it('picks the active row out of the page', () => {
    const active = pregnancy({ id: 'pregnancy-2', status: 'active' });
    expect(activePregnancy(page([pregnancy({}), active]))?.id).toBe(
      'pregnancy-2'
    );
  });

  it('returns undefined when nothing is active or the page is missing', () => {
    expect(activePregnancy(page([pregnancy({})]))).toBeUndefined();
    expect(activePregnancy(undefined)).toBeUndefined();
  });
});

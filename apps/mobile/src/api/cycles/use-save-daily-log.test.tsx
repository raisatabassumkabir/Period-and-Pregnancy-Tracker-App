import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { client } from '../common';
import { useSaveDailyLog } from './use-save-daily-log';

jest.mock('../common', () => ({
  client: { post: jest.fn(), patch: jest.fn() },
}));

const mockedClient = client as jest.Mocked<typeof client>;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('useSaveDailyLog', () => {
  it('POSTs a new log when no id is given', async () => {
    mockedClient.post.mockResolvedValue({ data: { id: 'log-1' } });
    const { result } = renderHook(() => useSaveDailyLog(), { wrapper });

    await result.current.mutateAsync({ date: '2026-03-10', flow: 'light' });

    expect(mockedClient.post).toHaveBeenCalledWith('daily-logs/', {
      date: '2026-03-10',
      flow: 'light',
    });
    expect(mockedClient.patch).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('PATCHes the existing log by id, keeping the id out of the body', async () => {
    mockedClient.patch.mockResolvedValue({ data: { id: 'log-1' } });
    const { result } = renderHook(() => useSaveDailyLog(), { wrapper });

    await result.current.mutateAsync({
      id: 'log-1',
      date: '2026-03-10',
      mood: 'good',
    });

    expect(mockedClient.patch).toHaveBeenCalledWith('daily-logs/log-1/', {
      date: '2026-03-10',
      mood: 'good',
    });
    expect(mockedClient.post).not.toHaveBeenCalled();
  });

  it('propagates a 409 conflict for a duplicate date', async () => {
    mockedClient.post.mockRejectedValue(
      Object.assign(new Error('Request failed'), {
        response: {
          status: 409,
          data: {
            type: 'https://apiguide.dev/errors/resource-conflict',
            title: 'Conflict',
            status: 409,
            detail: 'A log for this date already exists.',
          },
        },
      })
    );
    const { result } = renderHook(() => useSaveDailyLog(), { wrapper });

    await expect(
      result.current.mutateAsync({ date: '2026-03-10' })
    ).rejects.toThrow('Request failed');
  });
});

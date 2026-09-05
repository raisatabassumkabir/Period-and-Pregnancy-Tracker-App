import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { client } from '../common';
import { useDeleteAccount } from './use-delete-account';

jest.mock('../common', () => ({
  client: { delete: jest.fn() },
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

describe('useDeleteAccount', () => {
  it('issues DELETE /me', async () => {
    mockedClient.delete.mockResolvedValue({ status: 204, data: undefined });
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await result.current.mutateAsync();

    expect(mockedClient.delete).toHaveBeenCalledWith('me');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('propagates server errors', async () => {
    mockedClient.delete.mockRejectedValue(
      Object.assign(new Error('Request failed'), { response: { status: 500 } })
    );
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await expect(result.current.mutateAsync()).rejects.toThrow(
      'Request failed'
    );
  });
});

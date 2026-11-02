import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { client, queryClient } from '../common';
import { useRedeemPartnerCode } from './use-partner-mutations';

jest.mock('../common', () => {
  const { QueryClient } = jest.requireActual('@tanstack/react-query');
  return {
    client: { post: jest.fn() },
    queryClient: new QueryClient({
      defaultOptions: { mutations: { retry: 3 } },
    }),
  };
});

const post = client.post as jest.Mock;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

afterEach(() => jest.clearAllMocks());

describe('useRedeemPartnerCode', () => {
  it('refreshes partner data even when the caller passes its own onSuccess', async () => {
    post.mockResolvedValue({ data: { id: 'l1', role: 'partner' } });
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useRedeemPartnerCode({ onSuccess }), {
      wrapper,
    });
    result.current.mutate({ code: 'HW-7K3M-Q9XA' });
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['partner-links'] });
  });

  it('never retries, so a used code is not resent', async () => {
    post.mockRejectedValue(
      Object.assign(new Error('Not Found'), { response: { status: 404 } })
    );
    const { result } = renderHook(() => useRedeemPartnerCode(), { wrapper });
    result.current.mutate({ code: 'HW-7K3M-Q9XA' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(post).toHaveBeenCalledTimes(1);
  });
});

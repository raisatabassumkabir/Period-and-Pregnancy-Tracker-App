import { client } from '../common';

jest.mock('../common', () => ({
  client: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedClient = client as jest.Mocked<typeof client>;

describe('POST /payments/subscription-sync/', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('synchronizes and returns the subscription status on success', async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        is_premium: true,
        subscription_status: 'active',
        subscription_ends_at: '2027-04-29T12:00:00Z',
        entitlement_id: 'premium',
        product_id: 'premium_monthly',
        store: 'play_store',
        is_sandbox: false,
        last_synced_at: '2026-10-11T12:00:00Z',
        warning: null,
      },
    });

    const result = await client
      .post('payments/subscription-sync/')
      .then((r) => r.data);

    expect(mockedClient.post).toHaveBeenCalledWith(
      'payments/subscription-sync/'
    );
    expect(result.is_premium).toBe(true);
    expect(result.entitlement_id).toBe('premium');
    expect(result.product_id).toBe('premium_monthly');
  });

  it('rejects on server error', async () => {
    const error = {
      response: {
        status: 500,
        data: { detail: 'RevenueCat service temporarily unavailable' },
      },
    };
    mockedClient.post.mockRejectedValueOnce(error);

    await expect(client.post('payments/subscription-sync/')).rejects.toEqual(
      error
    );
  });

  it('does not call the deprecated google-play/verify-purchase endpoint', () => {
    expect(mockedClient.post).not.toHaveBeenCalledWith(
      'payments/google-play/verify-purchase/'
    );
  });
});

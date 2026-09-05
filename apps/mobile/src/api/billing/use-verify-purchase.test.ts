import { client } from '../common';

jest.mock('../common', () => ({
  client: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedClient = client as jest.Mocked<typeof client>;

describe('POST /payments/google-play/verify-purchase/', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the upgraded subscription on success', async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        is_premium: true,
        subscription_status: 'active',
        subscription_ends_at: '2027-04-29T12:00:00Z',
        google_play_subscription_id: 'premium_monthly',
      },
    });

    const body = {
      subscription_id: 'premium_monthly',
      purchase_token: 'play-token',
    };
    const result = await client
      .post('payments/google-play/verify-purchase/', body)
      .then((r) => r.data);

    expect(mockedClient.post).toHaveBeenCalledWith(
      'payments/google-play/verify-purchase/',
      body
    );
    expect(result.is_premium).toBe(true);
  });

  it('rejects with 409 when the token is linked to another account', async () => {
    const error = {
      response: {
        status: 409,
        data: { detail: 'This purchase is already linked to another account.' },
      },
    };
    mockedClient.post.mockRejectedValueOnce(error);

    await expect(
      client.post('payments/google-play/verify-purchase/', {
        subscription_id: 'premium_monthly',
        purchase_token: 'taken',
      })
    ).rejects.toEqual(error);
  });

  it('rejects with 404 when Play has no record of the token', async () => {
    const error = {
      response: { status: 404, data: { detail: 'Purchase token not found' } },
    };
    mockedClient.post.mockRejectedValueOnce(error);

    await expect(
      client.post('payments/google-play/verify-purchase/', {
        subscription_id: 'premium_monthly',
        purchase_token: 'missing',
      })
    ).rejects.toEqual(error);
  });
});

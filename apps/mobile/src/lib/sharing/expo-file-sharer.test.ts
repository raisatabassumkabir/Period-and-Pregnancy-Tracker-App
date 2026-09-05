import * as Sharing from 'expo-sharing';

import { createExpoFileSharer } from './expo-file-sharer';

const mockWrite = jest.fn();
const mockCreate = jest.fn();

jest.mock('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///cache/' } },
  File: jest.fn().mockImplementation((...segments: string[]) => ({
    uri: `file:///cache/${segments.slice(1).join('/')}`,
    parentDirectory: { create: mockCreate },
    write: mockWrite,
  })),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

const mockedSharing = Sharing as jest.Mocked<typeof Sharing>;

beforeEach(() => jest.clearAllMocks());

describe('createExpoFileSharer', () => {
  it('writes the export to the cache and opens the share sheet', async () => {
    const sharer = createExpoFileSharer();
    expect(sharer.isAvailable()).toBe(true);

    await sharer.share({
      filename: 'word-bank.apkg',
      contents: 'bytes',
      contentType: 'application/octet-stream',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      idempotent: true,
      intermediates: true,
    });
    expect(mockWrite).toHaveBeenCalledWith('bytes');
    expect(mockedSharing.shareAsync).toHaveBeenCalledWith(
      'file:///cache/exports/word-bank.apkg',
      { mimeType: 'application/octet-stream', dialogTitle: 'word-bank.apkg' }
    );
  });

  it('throws when the OS cannot share', async () => {
    mockedSharing.isAvailableAsync.mockResolvedValueOnce(false);
    const sharer = createExpoFileSharer();
    await expect(
      sharer.share({ filename: 'x.csv', contents: '', contentType: 'text/csv' })
    ).rejects.toThrow('Sharing is not available on this device.');
    expect(mockWrite).not.toHaveBeenCalled();
  });
});

import { createMMKVQueryPersister } from './query-persister';

describe('createMMKVQueryPersister', () => {
  it('persists and restores client state synchronously', () => {
    const memory = new Map<string, string>();
    const mockStorage = {
      set: jest.fn((key: string, value: string) => {
        memory.set(key, value);
      }),
      getString: jest.fn((key: string) => {
        return memory.get(key);
      }),
      delete: jest.fn((key: string) => {
        memory.delete(key);
      }),
    };

    const persister = createMMKVQueryPersister(mockStorage as any);

    const clientState = {
      timestamp: Date.now(),
      buster: 'v1',
      clientState: {
        queries: [{ queryKey: ['cycles'], state: { data: { results: [] } } }],
        mutations: [],
      },
    };

    persister.persistClient(clientState as any);
    expect(mockStorage.set).toHaveBeenCalledTimes(1);

    const restored = persister.restoreClient();
    expect(restored).toEqual(clientState);

    persister.removeClient();
    expect(mockStorage.delete).toHaveBeenCalledTimes(1);
    expect(persister.restoreClient()).toBeUndefined();
  });
});

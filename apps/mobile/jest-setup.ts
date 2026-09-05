import '@testing-library/react-native/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Dev-only TanStack Query Devtools — pure ESM, swap with a no-op for tests.
jest.mock('@dev-plugins/react-query', () => ({
  useReactQueryDevTools: () => undefined,
}));

// Flash messages aren't useful in unit tests; stub the surface we use.
jest.mock('react-native-flash-message', () => ({
  __esModule: true,
  default: () => null,
  showMessage: jest.fn(),
  hideMessage: jest.fn(),
}));

// Amplitude Analytics & Session Replay mocks for tests
jest.mock('@amplitude/analytics-react-native', () => {
  class MockIdentify {
    properties: Record<string, unknown> = {};
    set(key: string, value: unknown) {
      this.properties[key] = value;
      return this;
    }
    setOnce(key: string, value: unknown) {
      this.properties[key] = value;
      return this;
    }
  }

  return {
    init: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    add: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    track: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    identify: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    setUserId: jest.fn(),
    reset: jest.fn(),
    setOptOut: jest.fn(),
    flush: jest.fn().mockReturnValue({ promise: Promise.resolve() }),
    Identify: MockIdentify,
  };
});

jest.mock('@amplitude/plugin-session-replay-react-native', () => ({
  SessionReplayPlugin: jest.fn().mockImplementation(() => ({
    name: '@amplitude/plugin-session-replay-react-native',
    type: 'enrichment',
    setup: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockImplementation((event) => Promise.resolve(event)),
  })),
}));

// react-hook form setup for testing
// @ts-ignore
global.window = {};
// @ts-ignore
global.window = global;

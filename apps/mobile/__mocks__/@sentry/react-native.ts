// The real SDK loads native modules; tests only need the call surface.
module.exports = {
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  wrap: jest.fn((component: unknown) => component),
};

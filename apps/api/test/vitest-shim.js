// Vitest compatibility shim for Jest
// Provides named exports similar to 'vitest' so existing tests can import from 'vitest'

const {
  describe,
  it,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  expect,
  jest: jestGlobal,
} = globalThis;

// Map common 'vi' helpers to Jest
const vi = {
  fn: jestGlobal.fn.bind(jestGlobal),
  spyOn: jestGlobal.spyOn.bind(jestGlobal),
  // Timer and module mocks can be expanded if needed
  useFakeTimers: (...args) => jestGlobal.useFakeTimers(...args),
  useRealTimers: () => jestGlobal.useRealTimers(),
  advanceTimersByTime: (ms) => jestGlobal.advanceTimersByTime(ms),
  clearAllMocks: () => jestGlobal.clearAllMocks(),
  resetAllMocks: () => jestGlobal.resetAllMocks(),
  restoreAllMocks: () => jestGlobal.restoreAllMocks(),
};

module.exports = {
  describe,
  it,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  expect,
  vi,
};

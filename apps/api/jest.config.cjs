module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.spec.js'],
  transform: {
    '^.+\\.[cm]?jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^vitest$': '<rootDir>/test/vitest-shim.js',
  },
};

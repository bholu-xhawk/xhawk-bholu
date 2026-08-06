module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
        plugins: [
          function transformImportMeta() {
            return {
              visitor: {
                MetaProperty(path) {
                  if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
                    path.replaceWithSourceString('globalThis.__IMPORT_META__');
                  }
                },
              },
            };
          },
        ],
      },
    ],
  },
};

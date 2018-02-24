const { appSrc, ownDirFile } = require('../paths');

module.exports = {
  roots: [
    appSrc,
  ],
  setupFiles: [
    ownDirFile('config/jest/adapter.js'),
  ],
  moduleNameMapper: {
    '^.+\\.(css|scss)$': 'babel-jest',
  },
  transform: {
    '\\.js$': ownDirFile('config/jest/babelTransformer.js'),
  },
  cacheDirectory: '/tmp/jest',
};

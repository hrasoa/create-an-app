const jest = require('jest');

const args = [
  '-c',
  require.resolve('../config/jest/config.js'),
];

jest.run(args);

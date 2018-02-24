const spawn = require('cross-spawn');
const { isDevelopment } = require('../config/env');

spawn(
  'node',
  [
    require.resolve(`../server/${isDevelopment ? 'dev' : 'prod'}`),
  ],
  {
    stdio: 'inherit',
  },
);

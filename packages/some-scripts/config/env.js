const env = process.env.BABEL_ENV || process.env.NODE_ENV;
const isProduction = env === 'production';

module.exports = {
  env,
  isDevelopment: !isProduction,
  isProduction,
  isTest: env === 'test',
  port: process.env.PORT || 3000,
};

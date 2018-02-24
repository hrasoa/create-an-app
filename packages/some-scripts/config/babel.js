const { isDevelopment, isTest } = require('./env');

function getPlugins(target) {
  switch (target) {
    case 'web':
      return [
        ['@babel/plugin-transform-runtime', {
          helpers: false,
          polyfill: false,
          regenerator: true,
        }],
        '@babel/plugin-syntax-dynamic-import',
        'react-loadable/babel',
        isDevelopment && 'react-hot-loader/babel',
      ].filter(Boolean);

    case 'node':
      return ['dynamic-import-node'];

    default:
      return [];
  }
}

function getPresets(target) {
  const isWeb = target === 'web';
  const presets = [
    isWeb && [
      '@babel/preset-env', {
        targets: {
          browsers: ['last 2 versions', 'safari >= 7'],
        },
      },
    ],
    isTest && '@babe/preset-env',
    !isTest && '@babel/preset-es2015',
    !isTest && '@babel/preset-stage-3',
    '@babel/preset-react',
  ];
  return presets.filter(Boolean);
}

module.exports = target => ({
  presets: getPresets(target),
  plugins: getPlugins(target),
});

const { appDistServer } = require('../config/paths');
const babelConfing = require('../config/babel');

module.exports = {
  name: 'server',
  target: 'node',
  // mode: 'production',
  entry: './server/render',
  stats: {
    modules: false,
  },
  output: {
    path: appDistServer,
    filename: 'render.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        options: babelConfing('node'),
      },
      {
        test: /\.scss$/,
        use: [
          'css-loader',
          'sass-loader',
        ],
        exclude: /node_modules/,
      },
    ],
  },
};

const { appDistServer } = require('../config/paths');
const { eslintConfig } = require('../config/webpack');
const babelConfing = require('../config/babel');

module.exports = {
  name: 'server',
  target: 'node',
  // mode: 'development',
  entry: './server/render',
  output: {
    path: appDistServer,
    filename: 'render.js',
    libraryTarget: 'commonjs2',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: babelConfing('node'),
          },
          {
            loader: 'eslint-loader',
            options: {
              configFile: eslintConfig,
            },
          },
        ],
        exclude: /node_modules/,
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

const webpack = require('webpack');
const { appDistClient } = require('../config/paths');
const { eslintConfig } = require('../config/webpack');
const babelConfing = require('../config/babel');

module.exports = {
  name: 'client',
  target: 'web',
  mode: 'development',
  entry: [
    'webpack-hot-middleware/client',
    './src/index.js',
  ],
  output: {
    path: appDistClient,
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: '/',
  },
  resolve: {
    // We are able to load different version of a module
    // Credit: https://twitter.com/rhysforyou/status/961826319225970690
    // For example on dev we load react-hot-loader in our App (src/containers/App)
    // and we do not want it on production
    extensions: ['.dev.js', '.js', '*'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: babelConfing('web'),
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
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
        exclude: /node_modules/,
      },
    ],
  },
  devtool: 'source-map',
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'all',
          minChunks: 2,
          name: 'commons',
        },
        vendors: {
          test: /node_modules/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    // new StyleLintPlugin({ configFile: stylelintConfig }),
  ],
};

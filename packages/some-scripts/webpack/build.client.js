const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StatsPlugin = require('stats-webpack-plugin');
const { appDistClient } = require('../config/paths');
const babelConfing = require('../config/babel');

module.exports = {
  name: 'client',
  target: 'web',
  mode: 'production',
  entry: {
    main: './src/index.js',
  },
  stats: {
    modules: false,
    publicPath: true,
    colors: true,
  },
  output: {
    path: appDistClient,
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        options: babelConfing('web'),
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
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'all',
          minChunks: 2,
          name: 'commons',
          maxInitialRequests: 5, // The default limit is too small to showcase the effect
          minSize: 0, // This is example is too small to create commons chunks
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
    new CopyWebpackPlugin([
      'public/manifest.json',
    ]),
    new StatsPlugin('stats.json'),
    new WorkboxPlugin({
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: new RegExp('/'),
          handler: 'networkFirst',
        },
        {
          urlPattern: new RegExp('/about'),
          handler: 'cacheFirst',
        },
      ],
    }),
  ],
};

const express = require('express');
const favicon = require('serve-favicon');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackHotServerMiddleware = require('webpack-hot-server-middleware');
const log = require('../utils/log');
const Template = require('../utils/template');
const through = require('../utils/through');
const clientConfig = require('../webpack/dev.client');
const serverConfig = require('../webpack/dev.server');
const { appPublicFile } = require('../config/paths');
const { port } = require('../config/env');

const app = express();
app.use(favicon(appPublicFile('favicon.ico')));

let isBuilt = false;
const done = () =>
  !isBuilt &&
  app.listen(port, () => {
    isBuilt = true;
    log.start(port);
  });

const bundler = webpack([clientConfig, serverConfig]);
app.use(webpackDevMiddleware(bundler, {
  stats: {
    colors: true,
    modules: false,
    publicPath: true,
  },
}));
app.use(webpackHotMiddleware(bundler.compilers.find(compiler => compiler.name === 'client')));
app.use(webpackHotServerMiddleware(bundler, {
  serverRendererOptions: {
    options: { log, Template, through },
  },
}));
bundler.plugin('done', done);

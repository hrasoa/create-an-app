const express = require('express');
const favicon = require('serve-favicon');
const readFile = require('../utils/readFile');
const log = require('../utils/log');
const Template = require('../utils/template');
const through = require('../utils/through');

const {
  appDistClientFile,
  appDistClient,
  appDistServerFile,
  appPublicFile,
} = require('../config/paths');
const { port } = require('../config/env');

const render = require(appDistServerFile('render')).default;
const clientStats = require(appDistClientFile('stats.json'));
const manifest = require(appPublicFile('manifest.json'));

const app = express();
app.use(express.static(appDistClient));
app.use(favicon(appPublicFile('favicon.ico')));

(async () => {
  // Inline scripts
  const fontLoader = readFile(appDistClientFile('fontLoader.js'));
  const fontLoaderRaw = await fontLoader;
  app.use(render({
    clientStats,
    options: {
      log,
      Template,
      through,
      templateOptions: { fontLoaderRaw, manifest },
    },
  }));
  app.listen(port, () => {
    log.start(port);
  });
})();

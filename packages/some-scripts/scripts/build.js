const UglifyJS = require('uglify-js');
const webpack = require('webpack');
const readFile = require('../utils/readFile');
const writeFile = require('../utils/writeFile');
const { appDistClientFile, ownDirFile } = require('../config/paths');
const clientConfig = require('../webpack/build.client.js');
const serverConfig = require('../webpack/build.server.js');

/* eslint-disable no-console */
webpack([clientConfig, serverConfig], async (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err);
    return;
  }
  console.log(stats.toString({ ...clientConfig.stats }));
  console.log();
  console.log('Begin uglify...');
  const fontLoader = await readFile(ownDirFile('utils/fontLoader.js'));
  const { code } = UglifyJS.minify(fontLoader);
  await writeFile(appDistClientFile('fontLoader.js'), code);
  console.log('Done');
});

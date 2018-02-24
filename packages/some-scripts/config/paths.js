const { resolve, join } = require('path');
const fs = require('fs');

const appDir = fs.realpathSync(process.cwd());
const ownDir = resolve(__dirname, '../');

const resolveApp = relativePath => resolve(appDir, relativePath);

const appSrc = resolveApp('src');
const appPublic = resolveApp('public');
const appDist = resolveApp('dist');
const appWebpack = resolveApp('webpack');
const appDistClient = join(appDist, 'client');
const appDistServer = join(appDist, 'server');

module.exports = {
  appDir,
  appSrc,
  appPublic,
  appDist,
  appDistClient,
  appDistServer,
  appWebpack,
  ownDir,
  appDirFile: file => join(appDir, file),
  appSrcFile: file => join(appSrc, file),
  appPublicFile: file => join(appPublic, file),
  appDistFile: file => join(appDist, file),
  appDistClientFile: file => join(appDistClient, file),
  appDistServerFile: file => join(appDistServer, file),
  ownPublicFile: file => join(ownDir, 'public', file),
  ownDirFile: file => join(ownDir, file),
};

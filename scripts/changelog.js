const fs = require('fs');
const path = require('path');
const spawn = require('cross-spawn');
const { version } = require('../lerna.json');

const rr = fs.createReadStream(path.resolve(__dirname, '../CHANGELOG.md'), {
  start: 4,
  end: 8,
  encoding: 'utf8',
});
rr.on('readable', () => {
  const lastVersion = rr.read();
  spawn('lerna-changelog', [
    '--tag-from',
    lastVersion,
    '--tag-to',
    version,
  ], {
    stdio: 'inherit',
  });
});

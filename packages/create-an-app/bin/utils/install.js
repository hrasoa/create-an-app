const spawn = require('cross-spawn');

module.exports = (args, options, useYarn) => new Promise((resolve, reject) => {
  const manager = useYarn ? 'yarn' : 'npm';
  const cmd = useYarn ? 'add' : 'install';

  const child = spawn(manager, [
    cmd,
    ...args,
  ], {
    stdio: 'inherit',
    ...options,
  });
  child.on('exit', (code) => {
    if (code !== 0) reject(new Error(`child process exited with code ${code}`));
    resolve(code);
  });
})
  .then(() => true)
  .catch(() => false);

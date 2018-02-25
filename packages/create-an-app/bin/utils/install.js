const spawn = require('cross-spawn');
const colors = require('./colors');

const command = (args, options) => new Promise((resolve, reject) => {
  const cmd = spawn('yarn', [
    'add',
    ...args,
  ], {
    stdio: 'inherit',
    ...options,
  });
  cmd.on('exit', (code) => {
    if (code !== 0) reject(new Error(`child process exited with code ${code}`));
    resolve(code);
  });
});

module.exports = async (args, options) => {
  const child = await command(args, options)
    .then(() => true)
    .catch((error) => {
      console.log(`${colors.debug('info')} ${error.message}`);
    });
  return child;
};

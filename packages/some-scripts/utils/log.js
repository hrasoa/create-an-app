const { magenta, red } = require('./colors');

/* eslint-disable no-console */
module.exports = {
  info: (msg) => {
    console.log(magenta(msg));
  },
  error: (msg) => {
    console.log(red(msg));
  },
  start: function (port = 3000) {
    this.info(`\n🌍  Your application is running at http://localhost:${port}\n`);
  },
};

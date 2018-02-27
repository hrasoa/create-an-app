const { magenta, red } = require('./colors');

/* eslint-disable no-console */
module.exports = {
  /**
   *
   * @param msg
     */
  info: (msg) => {
    console.log(magenta(msg));
  },
  /**
   *
   * @param msg
     */
  error: (msg) => {
    console.log(red(msg));
  },
  /**
   * 
   * @param port
     */
  start: function (port = 3000) {
    this.info(`\n🌍  Your application is running at http://localhost:${port}\n`);
  },
};

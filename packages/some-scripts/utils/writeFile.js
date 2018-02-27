const fs = require('fs');
const os = require('os');

/**
 * 
 * @param file
 * @param content
 */
module.exports = (file, content) => new Promise((resolve, reject) => {
  fs.writeFile(file, content + os.EOL, (err) => {
    if (err) reject(err);
    resolve(true);
  });
});

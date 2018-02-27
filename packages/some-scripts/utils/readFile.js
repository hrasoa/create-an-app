const fs = require('fs');

/**
 * 
 * @param file
 */
module.exports = file => new Promise((resolve, reject) => {
  fs.readFile(file, 'utf8', (err, content) => {
    if (err) reject(err);
    resolve(content);
  });
});

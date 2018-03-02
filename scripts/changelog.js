const fs = require('fs');
const path = require('path');
const through = require('through');
const { execSync } = require('child_process');
const minimist = require('minimist');
const { EOL } = require('os');

const argv = minimist(process.argv.slice(2));
const tagTo = argv.to || null;
const tagFrom = argv.from || null;
const tagFinalName = argv['final-name'] || null;
const md = path.resolve(__dirname, '../CHANGELOG.md');
const tmp = path.resolve(__dirname, '../CHANGELOG.tmp.md');

fs.createReadStream(md, { encoding: 'utf8' })
  .pipe(through(
    function write(data) {
      // Regex to seach for the last released tag
      const headlines = /## ([0-9a-z.-]+)/;
      const match = headlines.exec(data);
      if (tagTo && match && match.length >= 2) {
        try {
          const result = execSync(`lerna-changelog --tag-from ${tagFrom || match[1]} --tag-to ${tagTo}`);
          const changelog = Buffer.from(result).toString().trim();
          // Test if the command generated a changelog
          if (changelog && changelog.match(/## [0-9a-z.-]+/)) {
            // Prepend the new changelog
            this.queue(changelog.replace(tagTo, tagFinalName || tagTo));
            this.queue('\n\n');
          } else {
            console.log(changelog);
          }
        } catch (err) {
          this.queue(null);
        }
      }
      this.queue(data);
    },
    function end() {
      this.queue(EOL);
    },
  ))
  .pipe(fs.createWriteStream(tmp))
  .on('finish', () => {
    fs.rename(tmp, md, (err) => {
      if (err) console.log(err);
    });
  });

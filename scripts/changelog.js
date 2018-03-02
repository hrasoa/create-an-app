const fs = require('fs');
const path = require('path');
const through = require('through');
const { execSync } = require('child_process');
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const tagTo = argv['tag-to'] ? `v${argv['tag-to']}` : 'next';
const tagRoName = argv['tag-to-name'] ? `v${argv['tag-to-name']}` : null;
const md = path.resolve(__dirname, '../CHANGELOG.md');
const tmp = path.resolve(__dirname, '../CHANGELOG.tmp.md');

fs.createReadStream(md, { encoding: 'utf8' })
  .pipe(through(
    function write(data) {
      const headlines = /## ([0-9a-z.-]+)/;
      const match = headlines.exec(data);
      if (match && match.length >= 2) {
        try {
          const result = execSync(`lerna-changelog --tag-from ${match[1]} --tag-to ${tagTo}`);
          const changelog = Buffer.from(result).toString().trim();
          if (changelog) {
            this.queue(changelog.replace(tagTo, tagRoName || tagTo));
            this.queue('\n\n');
          }
        } catch (err) {
          this.queue(null);
        }
      }
      this.queue(data);
    },
    function end() {
      this.queue(null);
    },
  ))
  .pipe(fs.createWriteStream(tmp))
  .on('finish', () => {
    fs.rename(tmp, md, (err) => {
      if (err) console.log(err);
    });
  });

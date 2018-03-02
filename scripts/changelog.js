const fs = require('fs');
const path = require('path');
const through = require('through');
const { execSync } = require('child_process');

const tag = process.argv[2] ? `v${process.argv[2]}` : 'next';
const tagName = `v${process.argv[3]}`;
const md = path.resolve(__dirname, '../CHANGELOG.md');
const tmp = path.resolve(__dirname, '../CHANGELOG.tmp.md');
const wr = fs.createWriteStream(tmp);
const rr = fs.createReadStream(md, { encoding: 'utf8' });
rr
  .pipe(through(
    function write(data) {
      const headlines = /## ([0-9a-z.]+)/;
      const match = headlines.exec(data);
      if (match && match.length >= 2) {
        try {
          const result = execSync(`lerna-changelog --tag-from ${match[1]} --tag-to ${tag}`);
          const changelog = Buffer.from(result).toString().trim();
          if (changelog) {
            this.queue(changelog.replace(tag, tagName));
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
  .pipe(wr);

fs.rename(tmp, md, (err) => {
  if (err) console.log(err);
});

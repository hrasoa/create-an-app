const fs = require('fs');
const { appDirFile, ownDirFile } = require('./paths');

const eslintrc = '.eslintrc';
const styelintrc = '.stylelintrc';

const eslintPath = appDirFile(eslintrc);
const eslintConfig = fs.existsSync(eslintPath) ? eslintPath : ownDirFile(eslintrc);

const stylelintPath = appDirFile(styelintrc);
const stylelintConfig = fs.existsSync(stylelintPath) ? stylelintPath : ownDirFile(styelintrc);

module.exports = {
  eslintConfig,
  stylelintConfig,
};

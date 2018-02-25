#!/usr/bin/env node

const colors = require('./utils/colors');
const { engines } = require('../package.json');

const currentNodeVersion = process.versions.node;
const [major] = currentNodeVersion.split('.');

if (major < 8) {
  console.log(`${colors.error('error')} Your node v${currentNodeVersion} is not compatible.`);
  console.log(`Please upgrade to node ${engines.node}.`);
  process.exit(1);
}

require('./createAnApp');

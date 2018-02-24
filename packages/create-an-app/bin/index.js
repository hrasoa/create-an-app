#!/usr/bin/env node

const colors = require('./colors');
const { engines } = require('../package.json');

const currentNodeVersion = process.versions.node;
const [major] = currentNodeVersion.split('.');

if (major < 8) {
  console.log(`node v${colors.error('error')} ${currentNodeVersion} is not compatible.`);
  console.log(`Please ugrade to node ${engines.node}`);
  process.exit(1);
}

require('./createAnApp');

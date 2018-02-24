const babelJest = require('babel-jest');
const babel = require('../babel');

module.exports = babelJest.createTransformer({
  presets: babel().presets,
});

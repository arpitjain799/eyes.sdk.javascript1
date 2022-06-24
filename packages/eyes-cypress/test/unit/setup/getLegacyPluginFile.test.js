const getLegacyPuginFilePath = require('../../../src/setup/getLegacyPuginFilePath');
const fs = require('fs');
const {describe, it} = require('mocha');
const {expect} = require('chai');

describe('works with cypress10 and legacy plugin file', () => {
  it('works for legacy plugin file', () => {
    const configFileContent = fs.readFileSync(
      `${__dirname}/fixtures/cypressConfig-legacy-file.js`,
      'utf-8',
    );
    const path = getLegacyPuginFilePath(__dirname, configFileContent);
    expect(path).to.equal(`${__dirname}/cypress/plugins/index-run.js`);
  });
});

'use strict';
const {describe, it, before, after} = require('mocha');
const {expect} = require('chai');
const {exec} = require('child_process');
const {promisify: p} = require('util');
const path = require('path');
const pexec = p(exec);
const fs = require('fs');
const {presult} = require('@applitools/functional-commons');
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js');

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp');
const targetTestAppPath = path.resolve(
  __dirname,
  '../fixtures/testAppCopies/testApp-batchId-eyesOpen',
);

async function runCypress(pluginsFile, testFile = 'batchIdEyesOpen.js') {
  return (
    await pexec(
      `./node_modules/.bin/cypress run --headless --config testFiles=${testFile},integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/${pluginsFile},supportFile=cypress/support/index-run.js`,
      {
        maxBuffer: 10000000,
      },
    )
  ).stdout;
}

describe('handle batchId from eyesOpen', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true});
    }
    try {
      await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`);
      process.chdir(targetTestAppPath);
      await pexec(`npm install`, {
        maxBuffer: 1000000,
      });
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  });

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true});
  });

  it('works for batchIds from eyesOpen', async () => {
    await pexec(`npm install cypress@latest`);
    const config = {...applitoolsConfig, showLogs: true, failCypressOnDiff: false};
    fs.writeFileSync(
      `${targetTestAppPath}/applitools.config.js`,
      'module.exports =' + JSON.stringify(config, 2, null),
    );
    const [err, v] = await presult(runCypress('index-run.js', 'batchIdEyesOpen.js'));
    expect(err).to.be.undefined;
    expect(v).to.contain('Core.closeBatches');
    expect(v).to.contain('BatchId-EyesOpen1');
    expect(v).to.contain('BatchId-EyesOpen2');
  });
});

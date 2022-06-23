'use strict';
const {describe, it, before, after} = require('mocha');
const {expect} = require('chai');
const {exec} = require('child_process');
const {promisify: p} = require('util');
const path = require('path');
const pexec = p(exec);
const fs = require('fs');
const {presult} = require('@applitools/functional-commons');

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testAppCypress10');
const targetTestAppPath = path.resolve(
  __dirname,
  '../fixtures/testAppCopies/testApp-global-hooks-overrides-config-file',
);
const cwd = process.cwd();

async function runCypress() {
  return (
    await pexec(`./node_modules/.bin/cypress run`, {
      maxBuffer: 10000000,
    })
  ).stdout;
}

async function updateConfigFile(pluginFileName, testName = 'global-hooks-overrides.js') {
  const promise = new Promise(resolve => {
    fs.readFile(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8', function(
      err,
      contents,
    ) {
      if (err) {
        console.log(err);
        return;
      }

      const replaced = contents
        .replace(/index-run.js/g, pluginFileName)
        .replace(/integration-run/g, `integration-run/${testName}`)
        .replace(
          ` return require('./cypress/plugins/index-run.js')(on, config);`,
          ` require('../../../../')(module);
        return module.exports(on, config)`,
        );

      fs.writeFile(
        path.resolve(targetTestAppPath, `./cypress.config.js`),
        replaced,
        'utf-8',
        function(err) {
          if (err) {
            console.log(err);
          }
          resolve();
        },
      );
    });
  });
  await promise;
}

describe('global hooks override in cypress.config.js file', () => {
  beforeEach(async () => {
    await pexec(`cp ${sourceTestAppPath}/cypress.config.js ${targetTestAppPath}`);
  });

  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true});
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`);
    const packageJsonPath = path.resolve(targetTestAppPath, 'package.json');

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    process.chdir(cwd);
    const latestCypressVersion = (await pexec('npm view cypress version')).stdout.trim();

    packageJson.devDependencies['cypress'] = latestCypressVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    process.chdir(targetTestAppPath);
    await pexec(`npm install`, {
      maxBuffer: 1000000,
    });
  });

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true});
  });

  it('supports running user defined global hooks from cypress.config.js file', async () => {
    await updateConfigFile('index-run.js');
    let configContent = fs.readFileSync(
      path.resolve(targetTestAppPath, `./cypress.config.js`),
      'utf-8',
    );
    const globalHooks = `setupNodeEvents(on, config) {
      on('before:run', () => {
      console.log('@@@ before:run @@@');
      return null;
    });
  
    on('after:run', () => {
      console.log('@@@ after:run @@@');
      return null;
    });`;
    const content = configContent.replace(/setupNodeEvents\(on, config\) {/g, globalHooks);

    fs.writeFileSync(path.resolve(targetTestAppPath, `./cypress.config.js`), content, 'utf-8');
    const [err, output] = await presult(runCypress());
    expect(err).to.be.undefined;
    expect(output).to.contain('@@@ before:run @@@');
    expect(output).to.contain('@@@ after:run @@@');
  });
});

const {describe, it, before, after} = require('mocha');
const testStorybook = require('../util/testStorybook');
const {exec} = require('child_process');
const {promisify: p} = require('util');
const pexec = p(exec);
const path = require('path');
const {delay: _psetTimeout, presult} = require('@applitools/functional-commons');
const utils = require('@applitools/utils');
const snap = require('@applitools/snaptdout');
const {version} = require('../../package.json');

const envWithColor = {...process.env, FORCE_COLOR: true};
const spawnOptions = {stdio: 'pipe', env: envWithColor};

// SB older versions (aka: 5.0.0) expect to have 'config.js' as the config file,
// adding other files to older versions will cause a failure
// adding 'config.js' file to newer versions will also cause failure
// since each version has it's own configuration, we allow running only for those who were pre-configured
const getConfigFilesListByVersion = ver => {
  switch (ver) {
    case '5.0.0':
      return ['config.js'];
    case '6.0.0':
    case '6.4.0':
    case 'latest':
    case 'next':
      return ['main.js', 'preview.js'];
  }
  return [];
};
if (!process.env.STORYBOOK_VERSION) {
  process.env.STORYBOOK_VERSION = 'latest';
}
const storybookVersion = process.env.STORYBOOK_VERSION;
const storybookSourceDir = path.resolve(__dirname, '../fixtures/storybookCSF/');
const testConfigFile = path.resolve(__dirname, '../e2e/happy-config/storybook-csf.config.js');

const eyesStorybookPath = path.resolve(__dirname, '../../bin/eyes-storybook');
const versionDir = path.resolve(__dirname, `../fixtures/storybook-versions/${storybookVersion}`);

// target config directory
const storybookConfigDir = path.resolve(
  __dirname,
  `../fixtures/storybook-versions/${storybookVersion}/.storybook`,
);

describe('storybook-csf', () => {
  let closeStorybook;
  before(async () => {
    await pexec(`cp -r ${storybookSourceDir}/stories/. ${versionDir}/stories`);
    await pexec(`mkdir -p ${versionDir}/.storybook`);
    getConfigFilesListByVersion(storybookVersion).forEach(function(fileName) {
      pexec(`cp ${storybookSourceDir}/.storybook/${fileName} ${versionDir}/.storybook`);
    });

    process.chdir(versionDir);
    await pexec(`npm install`, {
      maxBuffer: 1000000,
    });
    closeStorybook = await testStorybook({
      port: 9001,
      storybookConfigDir,
    });
  });

  after(async () => {
    delete process.env.STORYBOOK_VERSION;
    await closeStorybook();
  });

  it(`renders storybook in version ${storybookVersion} and CSF format and takes snapshot after play function ends`, async () => {
    const [err, result] = await presult(
      utils.process.sh(`node ${eyesStorybookPath} -f ${testConfigFile}`, {spawnOptions}),
    );
    const stdout = err ? err.stdout : result.stdout;
    const output = stdout;
    /* .replace(/Total time\: \d+ seconds/, 'Total time: <some_time> seconds')
      .replace(
        /See details at https\:\/\/.+.applitools.com\/app\/test-results\/.+/g,
        'See details at <some_url>',
      )
      .replace(version, '<version>')
      .replace(/\d+(?:\.\d+)+/g, '<browser_version>'); */
    await snap(output, `storybook version ${storybookVersion} with CSF and play function`);
  });
});

const {describe, it, before, after} = require('mocha');
const testStorybook = require('../util/testStorybook');
const {exec} = require('child_process');
const {promisify: p} = require('util');
const pexec = p(exec);
const path = require('path');
const {delay: _psetTimeout, presult} = require('@applitools/functional-commons');
const utils = require('@applitools/utils');
const snap = require('@applitools/snaptdout');
const {testsSupportedVersions} = require('../fixtures/storybook-versions/versions');
const {version} = require('../../package.json');

const envWithColor = {...process.env, FORCE_COLOR: true};
const spawnOptions = {stdio: 'pipe', env: envWithColor};

// SB older versions (aka: 5.0.0) expect to have 'config.js' as the config file,
// adding other files to older versions will cause a failure
// adding 'config.js' file to newer versions will also cause failure
// since each version has it's own configuration, we allow running only for those who were pre-configured (in 'testsSupportedVersions')
const getConfigFilesListByVersion = ver => {
  switch (ver) {
    case '5.0.0':
      return ['config.js'];
    default:
      return testsSupportedVersions.includes(ver) ? ['main.js', 'preview.js'] : [];
  }
};
if (!process.env.STORYBOOK_VERSION) {
  process.env.STORYBOOK_VERSION = 'latest';
}
const storybookVersion = String(process.env.STORYBOOK_VERSION);
const storybookSourceDir = path.resolve(__dirname, '../fixtures/storybookCSF/');
const testConfigFile = path.resolve(__dirname, '../e2e/happy-config/storybook-csf.config.js');

const eyesStorybookPath = path.resolve(__dirname, '../../bin/eyes-storybook');
const versionDir = path.resolve(__dirname, `../fixtures/storybook-versions/${storybookVersion}`);
process.env.INIT_CWD = versionDir;

describe('storybook-csf', () => {
  before(async () => {
    await pexec(`cp -r ${storybookSourceDir}/stories/. ${versionDir}/stories`);
    await pexec(`mkdir -p ${versionDir}/.storybook`);
    const filesByVersion = getConfigFilesListByVersion(storybookVersion);
    for (const fileName of filesByVersion) {
      pexec(`cp ${storybookSourceDir}/.storybook/${fileName} ${versionDir}/.storybook`);
    }
    // IMPORTANT
    // it is critical to 'change dir' to working directory in order to get the relevant 'start-storybook' of tested version
    process.chdir(versionDir);
  });

  after(async () => {
    delete process.env.STORYBOOK_VERSION;
    delete process.env.INIT_CWD;
  });

  it(`renders storybook in version ${storybookVersion} and CSF format and takes snapshot after play function ends`, async () => {
    const [err, result] = await presult(
      utils.process.sh(`node ${eyesStorybookPath} -f ${testConfigFile}`, {spawnOptions}),
    );
    const stdout = err ? err.stdout : result.stdout;
    const output = stdout
      .replace(/Total time\: \d+ seconds/, 'Total time: <some_time> seconds')
      .replace(
        /See details at https\:\/\/.+.applitools.com\/app\/test-results\/.+/g,
        'See details at <some_url>',
      )
      .replace(version, '<version>')
      .replace(/\d+(?:\.\d+)+/g, '<browser_version>');
    await snap(output, `storybook version ${storybookVersion} with CSF and play function`);
  });
});

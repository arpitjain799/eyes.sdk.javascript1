const {describe, it, before, after} = require('mocha');
const path = require('path');
const {testServerInProcess} = require('@applitools/test-server');
const utils = require('@applitools/utils');
const {presult} = require('@applitools/functional-commons');
const {version} = require('../../package.json');
const snap = require('@applitools/snaptdout');

const envWithColor = {...process.env, FORCE_COLOR: true};
const spawnOptions = {stdio: 'pipe', env: envWithColor};

describe('eyes-storybook per component', () => {
  let closeTestServer, showLogsOrig;
  before(async () => {
    closeTestServer = (await testServerInProcess({port: 7272})).close;
    showLogsOrig = process.env.APPLITOOLS_SHOW_LOGS;
    if (showLogsOrig) {
      console.warn(
        '\nThis test disables APPLITOOLS_SHOW_LOGS so dont be surprised son !!! See: test/e2e/eyes-storybook.e2e.test.js:15\n',
      );
    }
    delete process.env.APPLITOOLS_SHOW_LOGS;
  });

  after(async () => {
    await closeTestServer();
    process.env.APPLITOOLS_SHOW_LOGS = '';
  });

  it('renders test storybook per component', async () => {
    const [err, result] = await presult(
      utils.process.sh(
        `node ${path.resolve(__dirname, '../../bin/eyes-storybook')} -f ${path.resolve(
          __dirname,
          'happy-config/simple.config.js',
        )}`,
        {spawnOptions},
      ),
    );
    const stdout = err ? err.stdout : result.stdout;
    const stderr = err ? err.stderr : result.stderr;
    const normalizedStdout = stdout
      .replace(/\[Chrome \d+.\d+\]/g, '[Chrome]')
      .replace(version, '<version>')
      .replace(
        /See details at https\:\/\/.+.applitools.com\/app\/test-results\/.+/g,
        'See details at <some_url>',
      )
      .replace(/Total time\: \d+ seconds/, 'Total time: <some_time> seconds');
    await snap(normalizedStdout, 'stdout');
    await snap(stderr, 'stderr');
  });
});

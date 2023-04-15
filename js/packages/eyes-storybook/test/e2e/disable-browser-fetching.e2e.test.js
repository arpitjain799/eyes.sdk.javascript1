const {describe, it, before, after} = require('mocha');
const testStorybook = require('../util/testStorybook');
const path = require('path');
const {delay: _psetTimeout, presult} = require('@applitools/functional-commons');
const utils = require('@applitools/utils');
const snap = require('@applitools/snaptdout');
const {version} = require('../../package.json');
const {makeTestServer} = require('@applitools/test-server');

const envWithColor = {...process.env, FORCE_COLOR: true};
const spawnOptions = {stdio: 'pipe', env: envWithColor};

describe('eyes-storybook', () => {
  let closeStorybook, closeTestServer;
  before(async () => {
    const staticPath = path.resolve(__dirname, '../fixtures/disableBrowserFetching');
    const testServer = await makeTestServer({
      port: 8882,
      // TODO: fix hard-linking to middleware in core
      middlewares: [{path: path.resolve('../core/test/fixtures/middlewares/ua-middleware')}],
      userAgent: 'node-fetch',
      staticPath,
    });
    closeTestServer = testServer.close;
    closeStorybook = await testStorybook({
      port: 9001,
      storybookConfigDir: staticPath,
    });
  });

  after(async () => {
    await closeStorybook();
    await closeTestServer();
  });

  it('disable browser fetching works', async () => {
    const [err, result] = await presult(
      utils.process.sh(
        `node ${path.resolve(__dirname, '../../bin/eyes-storybook')} -f ${path.resolve(
          __dirname,
          'happy-config/disable-browser-fetching.config.js',
        )}`,
        {spawnOptions},
      ),
    );
    const stdout = err ? err.stdout : result.stdout;
    //const stderr = err ? err.stderr : result.stderr;
    const output = stdout
      .replace(/Total time\: \d+ seconds/, 'Total time: <some_time> seconds')
      .replace(
        /See details at https\:\/\/.+.applitools.com\/app\/test-results\/.+/g,
        'See details at <some_url>',
      )
      .replace(version, '<version>')
      .replace(/\d+(?:\.\d+)+/g, '<browser_version>');
    console.log(output);
    await snap(output, 'disable browser fetching config');
  });
});

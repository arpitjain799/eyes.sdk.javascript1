'use strict';

const {describe, it, before, after} = require('mocha');
const {expect} = require('chai');
const testStorybook = require('../util/testStorybook');
const path = require('path');
const {testServerInProcess} = require('@applitools/test-server');
const eyesStorybook = require('../../src/eyesStorybook');
const {generateConfig} = require('../../src/generateConfig');
const {configParams: externalConfigParams} = require('../../src/configParams');
const {makeTiming} = require('@applitools/monitoring-commons');
const logger = require('../util/testLogger');
const testStream = require('../util/testStream');
const {performance, timeItAsync} = makeTiming();
const fetch = require('node-fetch');
const snap = require('@applitools/snaptdout');

describe('eyes-storybook accessibility', () => {
  let closeStorybook, closeTestServer;
  before(async () => {
    const server = await testServerInProcess({port: 7272});
    closeTestServer = server.close;
    closeStorybook = await testStorybook({
      port: 9001,
      storybookConfigDir: path.resolve(__dirname, '../fixtures/accessibilityStorybook'),
    });
  });

  after(async () => {
    await closeStorybook();
    await closeTestServer();
  });

  it('renders storybook with accessibility validation', async () => {
    const {stream, getEvents} = testStream();
    const configPath = path.resolve(__dirname, 'happy-config/accessibility.config.js');
    const globalConfig = require(configPath);
    const defaultConfig = {waitBeforeScreenshots: 50};
    const config = generateConfig({argv: {conf: configPath}, defaultConfig, externalConfigParams});

    let results = await eyesStorybook({
      config: {
        storybookUrl: 'http://localhost:9001',
        browser: [{name: 'chrome', width: 800, height: 600}],
        ...config,
        // puppeteerOptions: {headless: false, devtools: true},
      },
      logger,
      performance,
      timeItAsync,
      outputStream: stream,
    });

    const expectedTitles = ['Single category: Story with local accessibility region'];
    expect(results.results.map(e => e.title).sort()).to.eql(expectedTitles.sort());
    results = results.results.flatMap(r => r.resultsOrErr);
    expect(results.some(x => x instanceof Error)).to.be.false;
    expect(results).to.have.length(1);
    for (const testResults of results) {
      const sessionUrl = `${testResults.apiUrls.session}?format=json&AccessToken=${testResults.secretToken}&apiKey=${process.env.APPLITOOLS_API_KEY}`;

      const session = await fetch(sessionUrl).then(r => r.json());
      const [actualAppOutput] = session.actualAppOutput;
      expect(actualAppOutput.imageMatchSettings.accessibilitySettings).to.eql({
        level: globalConfig.accessibilityValidation.level,
        version: globalConfig.accessibilityValidation.guidelinesVersion,
      });
      expect(actualAppOutput.imageMatchSettings.accessibility).to.eql([
        {
          type: 'LargeText',
          isDisabled: false,
          left: 16,
          top: 16,
          width: 50,
          height: 50,
          regionId: '.accessibility-element',
        },
      ]);
    }

    await snap(getEvents().join(''), 'accessibility validation');
  });
});

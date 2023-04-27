const {describe, it, before, after, beforeEach, afterEach} = require('mocha');
const flatten = require('lodash.flatten');
const {expect} = require('chai');
const testStorybook = require('../util/testStorybook');
const path = require('path');
const {testServerInProcess} = require('@applitools/test-server');
const fakeEyesServer = require('../util/fakeEyesServer');
const eyesStorybook = require('../../src/eyesStorybook');
const {generateConfig} = require('../../src/generateConfig');
const defaultConfig = require('../../src/defaultConfig');
const {configParams: externalConfigParams} = require('../../src/configParams');
const {makeTiming} = require('@applitools/monitoring-commons');
const logger = require('../util/testLogger');
const testStream = require('../util/testStream');
const {performance, timeItAsync} = makeTiming();
const fetch = require('node-fetch');
const snap = require('@applitools/snaptdout');

describe('eyesStorybook', () => {
  let closeStorybook, closeTestServer;
  before(async () => {
    closeStorybook = await testStorybook({port: 9001});
    closeTestServer = (await testServerInProcess({port: 7272})).close;
  });

  after(async () => {
    await closeTestServer();
    await closeStorybook();
  });

  let serverUrl, closeEyesServer;
  beforeEach(async function() {});
  afterEach(async () => {
    await closeEyesServer();
  });

  it('renders test storybook with fake eyes and visual grid', async () => {
    const {port, close} = await fakeEyesServer();
    closeEyesServer = close;
    serverUrl = `http://localhost:${port}`;
    const {stream, getEvents} = testStream();
    const configPath = path.resolve(__dirname, '../fixtures/applitools.config.js');
    const globalConfig = require(configPath);
    const defaultConfig = {waitBeforeScreenshots: 50};
    const config = generateConfig({argv: {conf: configPath}, defaultConfig, externalConfigParams});
    let results = await eyesStorybook({
      config: {
        ...config,
        serverUrl,
        storybookUrl: 'http://localhost:9001',
        browser: [{name: 'chrome', width: 800, height: 600}],
        // puppeteerOptions: {headless: false, devtools: true},
        // include: (() => {
        //   let counter = 0;
        //   return () => counter++ < 1;
        // })(),
      },
      logger,
      performance,
      timeItAsync,
      outputStream: stream,
    });

    const expectedResults = [
      {
        name: 'Button with-space yes-indeed/nested with-space yes/nested again-yes a: c yes-a b',
        isPassed: true,
      },
      {name: 'Button with-space yes-indeed/nested with-space yes: b yes-a b', isPassed: true},
      {name: 'Button with-space yes-indeed: a yes-a b', isPassed: true},
      {name: 'Button: background color', isPassed: true},
      {name: 'Button: with some emoji', isPassed: true},
      {name: 'Button: with text', isPassed: true},
      {name: 'Image: image', isPassed: true},
      {name: 'Interaction: Popover', isPassed: true},
      {name: 'Nested/Component: story 1.1', isPassed: true},
      {name: 'Nested/Component: story 1.2', isPassed: true},
      {name: 'Nested: story 1', isPassed: true},
      {name: 'RTL: local RTL config', isPassed: true},
      {name: 'RTL: local RTL config [rtl]', isPassed: true},
      {name: 'RTL: should also do RTL', isPassed: true},
      {name: 'RTL: should also do RTL [rtl]', isPassed: true},
      {name: 'Responsive UI: Red/green', isPassed: true},
      {name: 'SOME section|Nested/Component: story 1.1', isPassed: true},
      {name: 'SOME section|Nested/Component: story 1.2', isPassed: true},
      {name: 'Text: appears after a delay', isPassed: true},
      {name: 'Theme: local theme config [theme=dark]', isPassed: true},
      {name: 'Theme: local theme config [theme=light]', isPassed: true},
      {
        name: 'Wow|one with-space yes-indeed/nested with-space yes/nested again-yes a: c yes-a b',
        isPassed: true,
      },
    ];

    const [strict, layout, content, floating, accessibility] = [
      globalConfig.strictRegions,
      globalConfig.layoutRegions,
      globalConfig.contentRegions,
      globalConfig.floatingRegions,
      globalConfig.accessibilityRegions,
    ].map(([{selector}]) => {
      const {
        x,
        y,
        width,
        height,
        maxDownOffset,
        maxUpOffset,
        maxLeftOffset,
        maxRightOffset,
      } = JSON.parse(selector);
      const res = {
        left: x,
        top: y,
        width,
        height,
      };
      if (maxDownOffset != undefined) {
        return [
          {
            ...res,
            maxDownOffset,
            maxLeftOffset,
            maxRightOffset,
            maxUpOffset,
            regionId: JSON.stringify({
              x,
              y,
              width,
              height,
              maxDownOffset,
              maxLeftOffset,
              maxRightOffset,
              maxUpOffset,
            }),
          },
        ];
      } else {
        return [{...res, regionId: JSON.stringify({x, y, width, height})}];
      }
    });

    const expectedTitles = [
      'Button: with some emoji',
      'Button: with text',
      'Nested: story 1',
      'Image: image',
      'Nested/Component: story 1.1',
      'Nested/Component: story 1.2',
      'Button with-space yes-indeed: a yes-a b',
      'Button with-space yes-indeed/nested with-space yes: b yes-a b',
      'Button with-space yes-indeed/nested with-space yes/nested again-yes a: c yes-a b',
      'Button: background color',
      'SOME section|Nested/Component: story 1.1',
      'SOME section|Nested/Component: story 1.2',
      'Wow|one with-space yes-indeed/nested with-space yes/nested again-yes a: c yes-a b',
      'RTL: local RTL config',
      'RTL: should also do RTL',
      'Responsive UI: Red/green',
      'RTL: should also do RTL [rtl]',
      'RTL: local RTL config [rtl]',
      'Text: appears after a delay',
      'Interaction: Popover',
      'Theme: local theme config [theme=dark]',
      'Theme: local theme config [theme=light]',
    ];

    expect(results.results.map(e => e.title).sort()).to.eql(expectedTitles.sort());
    results = results.results.flatMap(r => r.resultsOrErr);

    expect(results.some(x => x instanceof Error)).to.be.false;
    expect(results).to.have.length(expectedResults.length);
    for (const testResults of results) {
      const id = `${testResults.appName}__${testResults.name}`;
      const sessionUrl = `${serverUrl}/api/sessions/batches/${encodeURIComponent(
        testResults.eyes.test.batchId,
      )}/${encodeURIComponent(id)}`;

      const session = await fetch(sessionUrl).then(r => r.json());
      const {scenarioIdOrName} = session.startInfo;
      const [componentName, state] = scenarioIdOrName.split(':').map(s => s.trim());

      expect(session.steps[0].options.imageMatchSettings.ignoreDisplacements).to.be.true;

      const expectedProperties = [
        {name: 'Component name', value: componentName},
        {name: 'State', value: state.replace(/ \[.+\]$/, '')}, // strip off variation
        {name: 'some prop', value: 'some value'},
      ];
      const queryParamMatch = state.match(/\[(.+)\]$/);
      if (queryParamMatch) {
        const [name, value] = queryParamMatch[1].split('=');
        expectedProperties.push({name: value ? name : 'eyes-variation', value: value || name}); // if there is no '=', then the name is `eyes-variation` and the value is the name
      }
      expect(session.startInfo.properties).to.eql(expectedProperties);

      const {imageMatchSettings} = session.steps[0].options;
      expect(imageMatchSettings.strict).to.eql([
        {
          ...strict[0],
        },
      ]);
      expect(imageMatchSettings.layout).to.eql([
        {
          ...layout[0],
        },
      ]);
      expect(imageMatchSettings.content).to.eql([
        {
          ...content[0],
        },
      ]);

      expect(imageMatchSettings.floating).to.eql(floating);
      expect(imageMatchSettings.accessibility).to.eql(accessibility);
    }
    expect(
      results
        .map(r => ({name: r.name, isPassed: r.status === 'Passed'}))
        .sort((a, b) => (a.name < b.name ? -1 : 1)),
    ).to.eql(expectedResults);

    await snap(getEvents().join(''), 'fake eyes');
  });

  it('enforces default concurrency', async () => {
    // adding renderDelay to reach max concurrency
    const {port, close} = await fakeEyesServer({renderDelay: 1500});
    closeEyesServer = close;
    serverUrl = `http://localhost:${port}`;
    const {stream} = testStream();
    const configPath = path.resolve(__dirname, '../fixtures/applitools.config.js');
    const config = generateConfig({argv: {conf: configPath}, defaultConfig, externalConfigParams});
    await eyesStorybook({
      config: {
        ...config,
        browser: [{name: 'chrome', width: 800, height: 600}],
        serverUrl,
        storybookUrl: 'http://localhost:9001',
      },
      logger,
      performance,
      timeItAsync,
      outputStream: stream,
    });

    const {maxRunning} = await fetch(`${serverUrl}/api/usage`).then(r => r.json());
    expect(maxRunning).to.equal(5); // TODO require from core
  });

  it('enforces testConcurrency', async () => {
    const {port, close} = await fakeEyesServer();
    closeEyesServer = close;
    serverUrl = `http://localhost:${port}`;
    const {stream} = testStream();
    const configPath = path.resolve(__dirname, '../fixtures/applitools.config.js');
    const config = generateConfig({argv: {conf: configPath}, defaultConfig, externalConfigParams});
    await eyesStorybook({
      config: {
        ...config,
        browser: [{name: 'chrome', width: 800, height: 600}],
        serverUrl,
        storybookUrl: 'http://localhost:9001',
        testConcurrency: 3,
      },
      logger,
      performance,
      timeItAsync,
      outputStream: stream,
    });

    const {maxRunning} = await fetch(`${serverUrl}/api/usage`).then(r => r.json());
    expect(maxRunning).to.equal(3);
  });

  it('enforces testConcurrency over legacy concurrency', async () => {
    const {port, close} = await fakeEyesServer();
    closeEyesServer = close;
    serverUrl = `http://localhost:${port}`;
    const {stream} = testStream();
    const configPath = path.resolve(__dirname, '../fixtures/applitools.config.js');
    const config = generateConfig({argv: {conf: configPath}, defaultConfig, externalConfigParams});
    await eyesStorybook({
      config: {
        ...config,
        browser: [{name: 'chrome', width: 800, height: 600}],
        serverUrl,
        storybookUrl: 'http://localhost:9001',
        testConcurrency: 3,
        concurrency: 20,
      },
      logger,
      performance,
      timeItAsync,
      outputStream: stream,
    });

    const {maxRunning} = await fetch(`${serverUrl}/api/usage`).then(r => r.json());
    expect(maxRunning).to.equal(3);
  });

  it('enforces legacy concurrency', async () => {
    const {port, close} = await fakeEyesServer({renderDelay: 5000});
    closeEyesServer = close;
    serverUrl = `http://localhost:${port}`;
    const {stream} = testStream();
    const configPath = path.resolve(
      __dirname,
      '../fixtures/applitools-legacy-concurrency.config.js',
    );
    const config = generateConfig({argv: {conf: configPath}, defaultConfig, externalConfigParams});
    await eyesStorybook({
      config: {
        ...config,
        browser: [{name: 'chrome', width: 800, height: 600}],
        storybookUrl: 'http://localhost:9001',
        serverUrl,
      },
      logger,
      performance,
      timeItAsync,
      outputStream: stream,
    });

    const {maxRunning} = await fetch(`${serverUrl}/api/usage`).then(r => r.json());
    expect(maxRunning).to.equal(10);
  });

  // This test doesn't pass in CI, probably because git is not installed or doesn't work as expected. This needs to be investigated
  it.skip('sends parentBranchBaselineSavedBefore when branchName and parentBranchName are specified, and there is a merge-base time for them', async () => {
    const {port, close} = await fakeEyesServer();
    closeEyesServer = close;
    serverUrl = `http://localhost:${port}`;
    const {stream} = testStream();
    const configPath = path.resolve(
      __dirname,
      '../fixtures/applitools-ignore-git-merge-base.config.js',
    );
    const defaultConfig = {waitBeforeScreenshots: 50};
    const config = generateConfig({argv: {conf: configPath}, defaultConfig, externalConfigParams});

    // this is the important part, because it's not `true` then `parentBranchBaselineSavedBefore` should be sent in `startInfo`
    delete config.ignoreGitMergeBase;

    let results = await eyesStorybook({
      config: {
        serverUrl,
        browser: [{name: 'chrome', width: 800, height: 600}],
        storybookUrl: 'http://localhost:9001',
        ...config,
      },
      logger,
      performance,
      timeItAsync,
      outputStream: stream,
    });
    results = flatten(results.map(r => r.resultsOrErr));
    for (const testResults of results) {
      const sessionUrl = `${serverUrl}/api/sessions/batches/${encodeURIComponent(
        testResults.getBatchId(),
      )}/${encodeURIComponent(testResults.getId())}`;

      const session = await fetch(sessionUrl).then(r => r.json());
      expect(session.startInfo.parentBranchBaselineSavedBefore).to.match(
        /\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}:\d{2}\+\d{2}\:\d{2}/,
      );
    }
  });

  it('handles ignoreGitMergeBase', async () => {
    const {port, close} = await fakeEyesServer();
    closeEyesServer = close;
    serverUrl = `http://localhost:${port}`;
    const {stream} = testStream();
    const configPath = path.resolve(
      __dirname,
      '../fixtures/applitools-ignore-git-merge-base.config.js',
    );
    const defaultConfig = {waitBeforeScreenshots: 50};
    const config = generateConfig({argv: {conf: configPath}, defaultConfig, externalConfigParams});

    let results = await eyesStorybook({
      config: {
        ...config,
        serverUrl,
        browser: [{name: 'chrome', width: 800, height: 600}],
        storybookUrl: 'http://localhost:9001',
      },
      logger,
      performance,
      timeItAsync,
      outputStream: stream,
    });
    results = results.results.flatMap(r => r.resultsOrErr);
    for (const testResults of results) {
      const id = `${testResults.appName}__${testResults.name}`;
      const sessionUrl = `${serverUrl}/api/sessions/batches/${encodeURIComponent(
        testResults.eyes.test.batchId,
      )}/${encodeURIComponent(id)}`;

      const session = await fetch(sessionUrl).then(r => r.json());
      expect(session.startInfo.parentBranchBaselineSavedBefore).to.be.undefined;
    }
  });

  it('fail immediately, wrong api key', async () => {
    const {port, close} = await fakeEyesServer();
    closeEyesServer = close;
    serverUrl = `http://localhost:${port}`;
    const config = {apiKey: 'INVALIDAPIKEY'}; // this is a well-known apiKey that is meant to return 401 from fake eyes server
    let errorMessage;

    try {
      await eyesStorybook({
        config: {
          ...config,
          serverUrl,
          storybookUrl: 'http://localhost:9001',
          appName: 'bla',
          browser: [{name: 'chrome', width: 800, height: 600}],
        },
        logger,
        performance,
      });
    } catch (e) {
      errorMessage = e.message;
    } finally {
      expect(errorMessage).to.equal('Incorrect API Key');
    }
  });
});

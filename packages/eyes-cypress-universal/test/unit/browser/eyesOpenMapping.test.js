const {describe, it} = require('mocha');
const {expect} = require('chai');
const {eyesOpenMapValues} = require('../../../src/browser/eyesOpenMapping');

describe('eyes open mapping', () => {
  const shouldUseBrowserHooks = true,
    dontCloseBatches = false,
    testName = 'test open mapping',
    defaultBrowser = {};
  it('should work with eyes open config', () => {
    const args = {
      browser: [
        {width: 1200, height: 1000, name: 'chrome'},
        {width: 800, height: 1000, name: 'chrome'},
      ],
    };

    const expected = {
      browsersInfo: [
        {width: 1200, height: 1000, name: 'chrome'},
        {width: 800, height: 1000, name: 'chrome'},
      ],
      dontCloseBatches,
      testName,
    };

    const coreConfig = eyesOpenMapValues({
      args,
      appliConfFile: {},
      testName,
      shouldUseBrowserHooks,
      defaultBrowser,
    });
    expect(coreConfig).to.be.deep.equal(expected);
  });

  it('should work with config file', () => {
    const args = {};

    const expected = {
      browsersInfo: [
        {width: 1200, height: 1000, name: 'chrome'},
        {width: 800, height: 1000, name: 'chrome'},
      ],
      apiKey: 'my api key',
      showLogs: true,
      testName,
      shouldUseBrowserHooks,
      dontCloseBatches: false,
    };
    const appliConfFile = {
      browser: [
        {width: 1200, height: 1000, name: 'chrome'},
        {width: 800, height: 1000, name: 'chrome'},
      ],
      apiKey: 'my api key',
      showLogs: true,
      dontCloseBatches: false,
      testName,
      shouldUseBrowserHooks,
    };
    const coreConfig = eyesOpenMapValues({
      args,
      appliConfFile,
      testName,
      shouldUseBrowserHooks,
      defaultBrowser,
    });
    expect(coreConfig).to.be.deep.equal(expected);
  });

  it('eyes open config should have precedence over config file', () => {
    const args = {
      browser: [
        {width: 1200, height: 1000, name: 'chrome'},
        {width: 800, height: 1000, name: 'chrome'},
      ],
      testName,
      shouldUseBrowserHooks,
      dontCloseBatches,
    };

    const expected = {
      browsersInfo: [
        {width: 1200, height: 1000, name: 'chrome'},
        {width: 800, height: 1000, name: 'chrome'},
      ],
      testName,
      dontCloseBatches,
      shouldUseBrowserHooks
    };
    const appliConfFile = {
      browser: [
        {width: 1100, height: 800, name: 'chrome'},
        {width: 1400, height: 650, name: 'chrome'},
      ],
      testName: 'name from file',
    };

    const coreConfig = eyesOpenMapValues({
      args,
      appliConfFile,
      testName,
      shouldUseBrowserHooks,
      defaultBrowser,
    });
    expect(coreConfig).to.be.deep.equal(expected);
  });
});

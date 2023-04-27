'use strict';
const {describe, it, beforeEach, afterEach} = require('mocha');
const {expect} = require('chai');
const {generateConfig} = require('../../src/generateConfig');

const sideEffectConfig = {
  testConcurrency: 5,
  storyDataGap: 10,
  serverUrl: 'https://eyesapi.applitools.com',
  viewportSize: {width: 1024, height: 600},
  renderers: [{name: 'chrome', width: 1024, height: 768}],
  saveNewTests: true,
  keepBatchOpen: undefined,
  fully: true,
};

describe('generateConfig', function() {
  let env;
  beforeEach(() => {
    env = process.env;
    process.env = {};
  });

  afterEach(() => {
    process.env = env;
  });

  it('handles defaultConfig', () => {
    const config = generateConfig({
      defaultConfig: {bla: 1},
    });
    expect(config).to.deep.eql({bla: 1, ...sideEffectConfig});
  });

  it('handles argv', () => {
    process.env.APPLITOOLS_BLA = 'from env';
    const config = generateConfig({
      defaultConfig: {knownProp: 'from default'},
      argv: {knownProp: 'from argv', unknownProp: 3},
    });

    expect(config).to.eql({knownProp: 'from argv', ...sideEffectConfig});
  });

  it('handles env config', () => {
    process.env.APPLITOOLS_BLA = 'from env';
    const config = generateConfig({
      defaultConfig: {bla: 'from default'},
    });
    expect(config).to.eql({bla: 'from env', ...sideEffectConfig});
  });

  it('handles externalConfigParams', () => {
    const config = generateConfig({
      externalConfigParams: ['bla'],
    });
    expect(config).to.eql({...sideEffectConfig});

    process.env.APPLITOOLS_BLA = 'bla from env';
    const config2 = generateConfig({
      externalConfigParams: ['bla'],
    });
    expect(config2).to.eql({bla: 'bla from env', ...sideEffectConfig});

    const config3 = generateConfig({
      externalConfigParams: ['bla'],
      defaultConfig: {kuku: 'buku'},
    });
    expect(config3).to.eql({bla: 'bla from env', kuku: 'buku', ...sideEffectConfig});
  });

  it('handles externalConfigParams with argv', () => {
    process.env.APPLITOOLS_BLA = 'bla from env';
    const config = generateConfig({
      externalConfigParams: ['bla'],
      argv: {bla: 'bla from argv'},
    });
    expect(config).to.eql({bla: 'bla from argv', ...sideEffectConfig});
  });

  it('handles number waitBeforeCapture from env variable', () => {
    process.env.APPLITOOLS_WAIT_BEFORE_CAPTURE = '1234';
    const config = generateConfig({
      externalConfigParams: ['waitBeforeCapture'],
    });
    expect(config).to.eql({waitBeforeCapture: 1234, ...sideEffectConfig});
  });

  it('backward compatible for waitBeforeScreenshots', () => {
    process.env.APPLITOOLS_WAIT_BEFORE_SCREENSHOTS = '.someClass';
    const defaultConfig = {waitBeforeCapture: 50, waitBeforeScreenshots: 50};
    const config = generateConfig({defaultConfig});
    expect(config.waitBeforeCapture).to.eql('.someClass');
  });

  it('backward compatible for waitBeforeScreenshot', () => {
    process.env.APPLITOOLS_WAIT_BEFORE_SCREENSHOT = '.someClass';
    const defaultConfig = {waitBeforeCapture: 50, waitBeforeScreenshot: 50};
    const config = generateConfig({defaultConfig});
    expect(config.waitBeforeCapture).to.eql('.someClass');
  });

  it('populates showLogs if APPLITOOLS_SHOW_LOGS env var is defined', () => {
    process.env.APPLITOOLS_SHOW_LOGS = 'true';
    const config = generateConfig({});
    expect(config.showLogs).to.be.true;
  });

  it('populate default renderers in not provided', () => {
    const config = generateConfig({argv: {}});
    expect(config.renderers).to.eql([{name: 'chrome', width: 1024, height: 768}]);
  });
});

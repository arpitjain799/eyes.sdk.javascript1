const {describe, it} = require('mocha');
const {expect} = require('chai');
const {eyesCheckMapValues} = require('../../../src/browser/eyesCheckMapping');

describe('eyes check mapping', () => {
    
  it('should work with eyes check config', () => {
    const args = {
      tag: 'some tag name',
      hooks: {
        scriptHooks: {
          beforeCaptureScreenshot: "document.body.style.backgroundColor = 'gold'",
        },
      },
      ignore: [{selector: 'some ignore region selector'}],
      layout: [{selector: 'some layout region selector'}],
      strict: [{selector: 'some strict region selector'}],
      content: [{selector: 'some content region selector'}],
      accessibility: [{selector: 'some accessibility region selector'}],
      floating: [{selector: 'some floating region selector'}],
      variationGroupId: {variationGroupId: 'Login screen variation #1'},
      target: 'region',
      selector: {
        type: 'css',
        selector: '.my-element',
      },
      useDom: true,
      enablePatterns: true,
      matchLevel: 'Layout',
      visualGridOptions: {
        polyfillAdoptedStyleSheets: true,
      },
      layoutBreakpoints: [500, 1000],
      waitBeforeCapture: 2000,
      ignoreDisplacements: true,
      fully: false,
    };

    const expected = {
      name: 'some tag name',
      scriptHooks: {
        scriptHooks: {
          beforeCaptureScreenshot: "document.body.style.backgroundColor = 'gold'",
        },
      },
      ignoreRegions: [{selector: 'some ignore region selector'}],
      layoutRegions: [{selector: 'some layout region selector'}],
      strictRegions: [{selector: 'some strict region selector'}],
      contentRegions: [{selector: 'some content region selector'}],
      accessibilityRegions: [{selector: 'some accessibility region selector'}],
      floatingRegions: [{selector: 'some floating region selector'}],
      variationGroupId: {variationGroupId: 'Login screen variation #1'},
      target: 'region',
      region: {
        selector: '.my-element',
        type: 'css',
      },
      useDom: true,
      enablePatterns: true,
      matchLevel: 'Layout',
      visualGridOptions: {
        polyfillAdoptedStyleSheets: true,
      },
      layoutBreakpoints: [500, 1000],
      waitBeforeCapture: 2000,
      ignoreDisplacements: true,
      fully: false,
    };

    const cypress = {
      config: prop => {
        if (prop === 'appliConfFile') {
          return {};
        } else {
          return undefined;
        }
      },
    };
    const coreConfig = eyesCheckMapValues({args, cypress});
    expect(coreConfig).to.be.deep.equal(expected);
  });

  it('should work with config file', () => {
    const args = {
      tag: 'some tag name',
    };

    const expected = {
      name: 'some tag name',
      scriptHooks: undefined,
      ignoreRegions: undefined,
      floatingRegions: undefined,
      contentRegions: undefined,
      strictRegions: undefined,
      accessibilityRegions: undefined,
      layoutRegions: undefined,
      waitBeforeCapture: 2000,
      ignoreDisplacements: true,
      layoutBreakpoints: [500, 1000],
    };

    const cypress = {
      config: prop => {
        if (prop === 'appliConfFile') {
          return {
            waitBeforeCapture: 2000,
            ignoreDisplacements: true,
            layoutBreakpoints: [500, 1000],
          };
        } else {
          return undefined;
        }
      },
    };
    const coreConfig = eyesCheckMapValues({args, cypress});
    expect(coreConfig).to.be.deep.equal(expected);
  });

  it('eyes check should have precedence over config file', () => {
    const args = {
      tag: 'some tag name',
      waitBeforeCapture: 2000,
      ignoreDisplacements: true,
      layoutBreakpoints: [500, 1000],
    };

    const expected = {
      name: 'some tag name',
      scriptHooks: undefined,
      ignoreRegions: undefined,
      floatingRegions: undefined,
      contentRegions: undefined,
      strictRegions: undefined,
      accessibilityRegions: undefined,
      layoutRegions: undefined,
      waitBeforeCapture: 2000,
      ignoreDisplacements: true,
      layoutBreakpoints: [500, 1000],
    };

    const cypress = {
      config: prop => {
        if (prop === 'appliConfFile') {
          return {
            waitBeforeCapture: 1000,
            ignoreDisplacements: false,
            layoutBreakpoints: [600, 850],
          };
        } else {
          return undefined;
        }
      },
    };

    const coreConfig = eyesCheckMapValues({args, cypress});
    expect(coreConfig).to.be.deep.equal(expected);
  });
});

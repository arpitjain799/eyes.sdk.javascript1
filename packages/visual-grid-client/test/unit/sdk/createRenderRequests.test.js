const {expect} = require('chai')
const createRenderRequest = require('../../../src/sdk/render/createRenderRequest')
const createResource = require('../../../src/sdk/resources/createResource')
const createDomResource = require('../../../src/sdk/resources/createDomResource')

describe('createRenderRequest', () => {
  let renderInfo, url, resources, dom

  beforeEach(() => {
    renderInfo = {
      getResultsUrl: () => 'resultsUrl',
      getStitchingServiceUrl: () => 'stitchingServiceUrl',
    }
    url = 'url'
    const resource1 = createResource({url: 'url1', value: 'content1'})
    const resource2 = createResource({url: 'url2', value: 'content2'})
    resources = {[resource1.url]: resource1.hash, [resource2.url]: resource2.hash}
    snapshot = createDomResource({cdt: 'cdt', resources}).hash
  })

  it('works', () => {
    const resource1 = createResource({url: 'url1', value: 'content1'})
    const resource2 = createResource({url: 'url2', value: 'content2'})
    const resources = {[resource1.url]: resource1.hash, [resource2.url]: resource2.hash}
    const dom = createDomResource({cdt: 'cdt', resources})

    const renderRequest = createRenderRequest({
      url,
      snapshot,
      resources,
      browser: {width: 1, height: 2, name: 'b1'},
      renderInfo,
      target: {},
      selector: 'selector',
      region: {left: 1, top: 2, width: 3, height: 4},
      scriptHooks: 'scriptHooks',
      sendDom: 'sendDom',
      userRegions: [],
    })

    expect(renderRequest).to.eql({
      webhook: 'resultsUrl',
      stitchingService: 'stitchingServiceUrl',
      url,
      resources: resources,
      browser: {name: 'b1'},
      scriptHooks: 'scriptHooks',
      sendDom: 'sendDom',
      enableMultipleResultsPerSelector: true,
      includeFullPageSize: undefined,
      options: undefined,
      platform: {
        name: undefined,
        type: "web",
      },
      renderInfo: {
        iosDeviceInfo: undefined,
        androidDeviceInfo: undefined,
        emulationInfo: undefined,
        width: 1,
        height: 2,
        selector: 'selector',
        target: {},
        region: {left: 1, top: 2, width: 3, height: 4},
      },
      selectorsToFindRegionsFor: undefined,
      snapshot,
    })
  })

  it('handles emulation info with deviceName', () => {
    const deviceName = 'deviceName'
    const screenOrientation = 'screenOrientation'
    const browser = {chromeEmulationInfo: {deviceName, screenOrientation}}
    const renderRequest = createRenderRequest({
      url,
      snapshot,
      resources,
      browser,
      renderInfo,
      userRegions: [],
    })

    expect(renderRequest).to.eql({
      webhook: 'resultsUrl',
      stitchingService: 'stitchingServiceUrl',
      url,
      snapshot,
      resources,
      enableMultipleResultsPerSelector: true,
      includeFullPageSize: undefined,
      browser: {name: undefined},
      options: undefined,
      platform: {type: 'web', name: undefined},
      scriptHooks: undefined,
      selectorsToFindRegionsFor: undefined,
      sendDom: undefined,
      renderInfo: {
        androidDeviceInfo: undefined,
        iosDeviceInfo: undefined,
        emulationInfo: {deviceName, screenOrientation},
        height: undefined,
        width: undefined,
        selector: undefined,
        region: undefined,
        target: undefined,
      },
    })
  })

  it('handles emulation info with device', () => {
    const browser = {width: 1, height: 2, deviceScaleFactor: 3}
    const renderInfo = {
      getResultsUrl: () => 'resultsUrl',
      getStitchingServiceUrl: () => 'stitchingServiceUrl',
    }
    const renderRequest = createRenderRequest({
      url,
      snapshot,
      resources,
      browser,
      renderInfo,
      userRegions: [],
    })

    expect(renderRequest).to.eql({
      webhook: 'resultsUrl',
      stitchingService: 'stitchingServiceUrl',
      url,
      snapshot,
      resources,
      browser: {name: undefined},
      enableMultipleResultsPerSelector: true,
      platform: {
        type: "web",
        name: undefined,
      },
      includeFullPageSize: undefined,
      options: undefined,
      scriptHooks: undefined,
      selectorsToFindRegionsFor: undefined,
      sendDom: undefined,
      renderInfo: {
        androidDeviceInfo: undefined,
        iosDeviceInfo: undefined,
        emulationInfo: {
          width: 1,
          height: 2,
          deviceScaleFactor: 3,
          screenOrientation: undefined,
          mobile: undefined,
        },
        height: 2,
        width: 1,
        selector: undefined,
        region: undefined,
        target: undefined,
      },
    })
  })

  it('handles selectorsToFindRegionsFor', () => {
    const browser = {width: 1, height: 2}
    const renderRequest = createRenderRequest({
      url,
      snapshot,
      resources,
      browser,
      renderInfo,
      selectorsToFindRegionsFor: [{selector: 'bla', type: 'css'}],
    })

    expect(renderRequest).to.eql({
      webhook: 'resultsUrl',
      stitchingService: 'stitchingServiceUrl',
      url,
      snapshot,
      resources,
      enableMultipleResultsPerSelector: true,
      renderInfo: {
        androidDeviceInfo: undefined,
        iosDeviceInfo: undefined,
        emulationInfo: undefined,
        height: 2,
        width: 1,
        selector: undefined,
        region: undefined,
        target: undefined,
      },
      selectorsToFindRegionsFor: [{type: 'css', selector: 'bla'}],
      browser: {name: undefined},
      enableMultipleResultsPerSelector: true,
      platform: {
        type: "web",
        name: undefined,
      },
      includeFullPageSize: undefined,
      options: undefined,
      scriptHooks: undefined,
      sendDom: undefined,
    })
  })

  it('handles iosDeviceInfo web', () => {
    const iosDeviceInfo = {
      deviceName: 'ios device',
      iosVersion: 'ios version',
      screenOrientation: 'ios screen orientation',
    }
    const browser = {iosDeviceInfo}
    const renderRequest = createRenderRequest({
      url,
      snapshot,
      resources,
      browser,
      renderInfo,
    })

    expect(renderRequest).to.eql({
      webhook: 'resultsUrl',
      stitchingService: 'stitchingServiceUrl',
      url,
      snapshot,
      resources,
      browser: {name: 'safari'},
      platform: {name: 'ios', type: 'web'},
      enableMultipleResultsPerSelector: true,
      renderInfo: {
        androidDeviceInfo: undefined,
        emulationInfo: undefined,
        iosDeviceInfo: {
          deviceName: 'ios device',
          iosVersion: 'ios version',
          screenOrientation: 'ios screen orientation',
        },
        region: undefined,
        selector: undefined,
        target: undefined,
        width: undefined,
        height: undefined,
      },
      selectorsToFindRegionsFor: undefined,
      enableMultipleResultsPerSelector: true,
      includeFullPageSize: undefined,
      options: undefined,
      scriptHooks: undefined,
      sendDom: undefined,
    })
  })
  it('handles iosDeviceInfo native', () => {
    const iosDeviceInfo = {
      deviceName: 'ios device',
      iosVersion: 'ios version',
      screenOrientation: 'ios screen orientation',
    }
    const browser = {iosDeviceInfo}
    const renderRequest = createRenderRequest({
      type: 'native',
      url,
      snapshot,
      resources,
      browser,
      renderInfo,
    })

    expect(renderRequest).to.eql({
      webhook: 'resultsUrl',
      stitchingService: 'stitchingServiceUrl',
      url,
      snapshot,
      resources,
      browser: {name: undefined},
      platform: {name: 'ios', type: 'native'},
      enableMultipleResultsPerSelector: true,
      renderInfo: {
        androidDeviceInfo: undefined,
        emulationInfo: undefined,
        iosDeviceInfo: {
          deviceName: 'ios device',
          iosVersion: 'ios version',
          screenOrientation: 'ios screen orientation',
        },
        region: undefined,
        selector: undefined,
        target: undefined,
        width: undefined,
        height: undefined,
      },
      selectorsToFindRegionsFor: undefined,
      enableMultipleResultsPerSelector: true,
      includeFullPageSize: undefined,
      options: undefined,
      scriptHooks: undefined,
      sendDom: undefined,
    })
  })
})

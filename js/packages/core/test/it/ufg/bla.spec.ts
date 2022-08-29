import {makeCore} from '../../../src/ufg/core'
import {testServer} from '@applitools/test-server'
import {readFileSync} from 'fs'
import {makeFakeClient} from '../../utils/fake-ufg-client'
import {makeFakeCore} from '../../utils/fake-base-core'
import * as utils from '@applitools/utils'
import assert from 'assert'

describe('openEyes', () => {
  let baseUrl, server

  before(async () => {
    server = await testServer()
    baseUrl = `http://localhost:${server.port}`
  })

  after(async () => {
    await server.close()
  })

  it('renders multiple viewport sizes', async () => {
    const core = makeCore({core: makeFakeCore(), client: makeFakeClient(), concurrency: 10})

    const eyes = await core.openEyes({
      settings: {serverUrl: 'server-url', apiKey: 'api-key', appName: 'app-name', testName: 'test-name'},
    })

    await eyes.check({
      target: {cdt: []},
      settings: {
        name: 'good',
        renderers: [
          {width: 320, height: 480},
          {width: 640, height: 768},
          {width: 1600, height: 900},
        ],
      },
    })

    const results = await eyes.close()

    console.log(results)

    assert.deepStrictEqual(
      results.map(result => result.stepsInfo.map((step: any) => step.asExpected)),
      [[true], [true], [true]],
    )
  })

  it('runs base check in the correct order', async () => {
    const core = makeCore({core: makeFakeCore(), client: makeFakeClient(), concurrency: 10})

    const eyes = await core.openEyes({
      settings: {serverUrl: 'server-url', apiKey: 'api-key', appName: 'app-name', testName: 'test-name'},
    })

    const target = {
      cdt: [],
      hooks: {
        check({settings}) {
          if (settings.name === 'one') return utils.general.sleep(200)
          else if (settings.name === 'two') return utils.general.sleep(100)
          else return utils.general.sleep(0)
        },
      },
    }

    await eyes.check({
      target,
      settings: {
        name: 'one',
        renderers: [
          {name: 'chrome', width: 320, height: 480},
          {name: 'firefox', width: 640, height: 768},
        ],
      },
    })
    await eyes.check({
      target,
      settings: {
        name: 'two',
        renderers: [
          {name: 'chrome', width: 320, height: 480},
          {name: 'firefox', width: 640, height: 768},
        ],
      },
    })
    await eyes.check({
      target,
      settings: {
        name: 'three',
        renderers: [
          {name: 'chrome', width: 320, height: 480},
          {name: 'firefox', width: 640, height: 768},
        ],
      },
    })

    const results = await eyes.close()
    assert.deepStrictEqual(
      results.map((result: any) => result.stepsInfo.map((step: any) => `${step.settings.name}-${result.renderer.name}`)),
      [
        ['one-chrome', 'two-chrome', 'three-chrome'],
        ['one-firefox', 'two-firefox', 'three-firefox'],
      ],
    )
  })

  it.only('handles region selector', async () => {
    const core = makeCore({core: makeFakeCore(), client: makeFakeClient(), concurrency: 10})

    const eyes = await core.openEyes({
      settings: {serverUrl: 'server-url', apiKey: 'api-key', appName: 'app-name', testName: 'test-name'},
    })

    await eyes.check({
      target: {cdt: []},
      settings: {name: 'good', region: 'sel1', renderers: [{width: 100, height: 100}]},
    })

    const results = await eyes.close()

    assert.deepStrictEqual(
      results.map(result => result.stepsInfo.map((step: any) => ({asExpected: step.asExpected, locationInViewport: step.target.locationInViewport}))),
      [[{asExpected: true, locationInViewport: {x: 1, y: 2}}]],
    )
  })

  it('handles "region" target', async () => {
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })

    wrapper.alwaysMatchResources = true
    wrapper.alwaysMatchDom = true

    checkWindow({
      snapshot: {cdt: []},
      url: 'some url',
      region: {width: 1, height: 2, left: 3, top: 4},
      target: 'region',
    })
    expect((await close())[0].getStepsInfo().map(r => r.result.getAsExpected())).to.eql([true])
  })

  it('renders the correct browser', async () => {
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      browser: {width: 320, height: 480, name: 'firefox'},
      url: `${baseUrl}/test.html`,
      appName,
    })

    const resourceUrls = wrapper.goodResourceUrls
    const cdt = loadJsonFixture('test.cdt.json')
    checkWindow({
      snapshot: {resourceUrls, cdt},
      tag: 'good1',
      sizeMode: 'some size mode',
      url: `${baseUrl}/test.html`,
    })
    await close()
    expect(await wrapper.getAppEnvironment().hostingApp).to.equal('firefox')
  })

  it('openEyes handles error during getRenderInfo', async () => {
    wrapper.getRenderInfo = async () => {
      await psetTimeout(0)
      throw new Error('getRenderInfo')
    }

    openEyes = makeRenderingGridClient({
      testConcurrency: 500,
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderWrapper: wrapper,
    }).openEyes

    await psetTimeout(50)

    const [error] = await presult(
      openEyes({
        wrappers: [wrapper],
        appName,
      }),
    )
    expect(error.message).to.equal('getRenderInfo')
  })

  it('openEyes handles authorization error during getRenderInfo', async () => {
    wrapper.getRenderInfo = async () => {
      await psetTimeout(0)
      const err = new Error('')
      err.response = {status: 401}
      throw err
    }

    openEyes = makeRenderingGridClient({
      testConcurrency: 500,
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderWrapper: wrapper,
    }).openEyes

    await psetTimeout(50)

    const [error] = await presult(
      openEyes({
        wrappers: [wrapper],
        appName,
      }),
    )
    expect(error.message).to.equal(authorizationErrMsg)
  })

  it('openEyes handles blocked account error during getRenderInfo', async () => {
    wrapper.getRenderInfo = async () => {
      await psetTimeout(0)
      const err = new Error('')
      err.response = {status: 403}
      throw err
    }

    openEyes = makeRenderingGridClient({
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderWrapper: wrapper,
    }).openEyes

    await psetTimeout(50)

    const [error] = await presult(
      openEyes({
        wrappers: [wrapper],
        appName,
      }),
    )
    expect(error.message).to.equal(blockedAccountErrMsg)
  })

  it('openEyes handles blocked account error during getRenderInfo', async () => {
    wrapper.getRenderInfo = async () => {
      await psetTimeout(0)
      const err = new Error('')
      err.response = {status: 400}
      throw err
    }

    openEyes = makeRenderingGridClient({
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderWrapper: wrapper,
    }).openEyes

    await psetTimeout(50)

    const [error] = await presult(
      openEyes({
        wrappers: [wrapper],
        appName,
      }),
    )
    expect(error.message).to.equal(badRequestErrMsg)
  })

  it('handles error during rendering', async () => {
    let error
    wrapper.renderBatch = async () => {
      throw new Error('renderBatch')
    }
    openEyes = makeRenderingGridClient({
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderWrapper: wrapper,
    }).openEyes
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      url: `bla`,
      appName,
    })

    checkWindow({snapshot: {resourceUrls: [], cdt: []}, url: `bla`})
    await psetTimeout(0)
    checkWindow({snapshot: {resourceUrls: [], cdt: []}, url: `bla`})
    error = await close().then(
      x => x,
      err => err,
    )
    expect(error[0].message).to.equal('renderBatch')
  })

  it('handles error during checkWindow', async () => {
    let error
    wrapper.checkWindow = async () => {
      throw new Error('checkWindow')
    }
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })

    checkWindow({snapshot: {resourceUrls: [], cdt: []}, url: `bla`})
    await psetTimeout(0)
    checkWindow({snapshot: {resourceUrls: [], cdt: []}, url: `bla`})
    error = await close().then(
      x => x,
      err => err,
    )
    expect(error[0].message).to.equal('checkWindow')
  })

  it('throws error during close', async () => {
    let error
    wrapper.close = async () => {
      await psetTimeout(0)
      throw new Error('close')
    }
    const {close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })

    error = await close().then(
      x => x,
      err => err,
    )
    expect(error[0].message).to.equal('close')
  })

  it('handles render status timeout when second checkWindow starts AFTER timeout of previous checkWindow', async () => {
    wrapper.getRenderStatus = async renderIds => {
      await psetTimeout(0)
      return renderIds.map(_renderId => new RenderStatusResults({status: 'rendering'}))
    }

    openEyes = makeRenderingGridClient({
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderStatusTimeout: 50,
      renderStatusInterval: 50,
      renderWrapper: wrapper,
    }).openEyes

    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })

    checkWindow({snapshot: {resourceUrls: [], cdt: []}, url: 'bla', tag: 'good1'})
    await psetTimeout(150)
    checkWindow({snapshot: {resourceUrls: [], cdt: []}, url: 'bla', tag: 'good1'})

    const [err3] = await presult(close())
    expect(err3[0].message).to.have.string(failMsg())
  })

  it('handles render status timeout when second checkWindow starts BEFORE timeout of previous checkWindow', async () => {
    wrapper.getRenderStatus = async renderIds => {
      await psetTimeout(0)
      return renderIds.map(_renderId => new RenderStatusResults({status: 'rendering'}))
    }

    openEyes = makeRenderingGridClient({
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderStatusTimeout: 150,
      renderStatusInterval: 50,
      renderWrapper: wrapper,
    }).openEyes

    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })

    checkWindow({snapshot: {resourceUrls: [], cdt: []}, url: 'bla', tag: 'good1'})
    await psetTimeout(0)
    checkWindow({snapshot: {resourceUrls: [], cdt: []}, url: 'bla', tag: 'good1'})
    await psetTimeout(200)
    const [err3] = await presult(close())
    expect(err3[0].message).have.string(failMsg())
  })

  it('sets configuration on wrappers', async () => {
    const wrappers = [createFakeWrapper(baseUrl), createFakeWrapper(baseUrl), createFakeWrapper(baseUrl)]

    openEyes = makeRenderingGridClient({
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderWrapper: wrapper,
      serverUrl: 'serverUrl',
      proxy: 'proxy',
      agentId: 'agentId',
    }).openEyes

    await openEyes({
      wrappers,
      url: 'bla',
      appName,
      baselineBranch: 'baselineBranch',
      baselineEnvName: 'baselineEnvName',
      baselineName: 'baselineName',
      envName: 'envName',
      ignoreCaret: 'ignoreCaret',
      isDisabled: false,
      matchLevel: 'matchLevel',
      accessibilitySettings: 'accessibilitySettings',
      parentBranch: 'parentBranch',
      branch: 'branch',
      saveDiffs: 'saveDiffs',
      saveFailedTests: 'saveFailedTests',
      saveNewTests: 'saveNewTests',
      compareWithParentBranch: 'compareWithParentBranch',
      ignoreBaseline: 'ignoreBaseline',
      browser: [{deviceName: 'device1'}, {deviceName: 'device2'}, {}],
      agentId: 'agentId',
      agentRunId: 'agentRunId',
      batchNotify: true,
    })

    for (const wrapper of wrappers) {
      expect(wrapper.baselineBranchName).to.equal('baselineBranch')
      expect(wrapper.baselineEnvName).to.equal('baselineEnvName')
      expect(wrapper.baselineName).to.equal('baselineName')
      expect(wrapper.envName).to.equal('envName')
      expect(wrapper.ignoreCaret).to.equal('ignoreCaret')
      expect(wrapper.isDisabled).to.equal(false)
      expect(wrapper.matchLevel).to.equal('matchLevel')
      expect(wrapper.accessibilitySettings).to.equal('accessibilitySettings')
      expect(wrapper.parentBranchName).to.equal('parentBranch')
      expect(wrapper.branchName).to.equal('branch')
      expect(wrapper.proxy).to.equal('proxy')
      expect(wrapper.saveDiffs).to.equal('saveDiffs')
      expect(wrapper.saveFailedTests).to.equal('saveFailedTests')
      expect(wrapper.saveNewTests).to.equal('saveNewTests')
      expect(wrapper.compareWithParentBranch).to.equal('compareWithParentBranch')
      expect(wrapper.ignoreBaseline).to.equal('ignoreBaseline')
      expect(wrapper.serverUrl).to.equal('serverUrl')
      expect(wrapper.baseAgentId).to.equal('agentId')
      expect(wrapper.batch.getNotifyOnCompletion()).to.be.true
      expect(wrapper.agentRunId).to.equal('agentRunId')
    }

    expect(wrappers[0].deviceInfo).to.equal('device1 (Chrome emulation)')
    expect(wrappers[1].deviceInfo).to.equal('device2 (Chrome emulation)')
    expect(wrappers[2].deviceInfo).to.equal('Desktop')
  })

  it('sets configuration on wrappers in makeRenderingGridClient', async () => {
    const wrappers = [createFakeWrapper(baseUrl), createFakeWrapper(baseUrl), createFakeWrapper(baseUrl)]

    openEyes = makeRenderingGridClient({
      showLogs: APPLITOOLS_SHOW_LOGS,
      apiKey,
      renderWrapper: wrapper,
      serverUrl: 'serverUrl',
      proxy: 'proxy',
      appName,
      baselineBranch: 'baselineBranch',
      baselineEnvName: 'baselineEnvName',
      baselineName: 'baselineName',
      envName: 'envName',
      ignoreCaret: 'ignoreCaret',
      isDisabled: false,
      matchLevel: 'matchLevel',
      accessibilitySettings: 'accessibilitySettings',
      parentBranch: 'parentBranch',
      branch: 'branch',
      saveDiffs: 'saveDiffs',
      saveFailedTests: 'saveFailedTests',
      saveNewTests: 'saveNewTests',
      compareWithParentBranch: 'compareWithParentBranch',
      ignoreBaseline: 'ignoreBaseline',
      browser: [{deviceName: 'device1'}, {deviceName: 'device2'}, {}],
      agentId: 'agentId',
    }).openEyes

    await openEyes({
      wrappers,
      url: 'bla',
    })

    for (const wrapper of wrappers) {
      expect(wrapper.baselineBranchName).to.equal('baselineBranch')
      expect(wrapper.baselineEnvName).to.equal('baselineEnvName')
      expect(wrapper.baselineName).to.equal('baselineName')
      expect(wrapper.envName).to.equal('envName')
      expect(wrapper.ignoreCaret).to.equal('ignoreCaret')
      expect(wrapper.isDisabled).to.equal(false)
      expect(wrapper.matchLevel).to.equal('matchLevel')
      expect(wrapper.accessibilitySettings).to.equal('accessibilitySettings')
      expect(wrapper.parentBranchName).to.equal('parentBranch')
      expect(wrapper.branchName).to.equal('branch')
      expect(wrapper.proxy).to.equal('proxy')
      expect(wrapper.saveDiffs).to.equal('saveDiffs')
      expect(wrapper.saveFailedTests).to.equal('saveFailedTests')
      expect(wrapper.saveNewTests).to.equal('saveNewTests')
      expect(wrapper.compareWithParentBranch).to.equal('compareWithParentBranch')
      expect(wrapper.ignoreBaseline).to.equal('ignoreBaseline')
      expect(wrapper.serverUrl).to.equal('serverUrl')
      expect(wrapper.baseAgentId).to.equal('agentId')
    }

    expect(wrappers[0].deviceInfo).to.equal('device1 (Chrome emulation)')
    expect(wrappers[1].deviceInfo).to.equal('device2 (Chrome emulation)')
    expect(wrappers[2].deviceInfo).to.equal('Desktop')
  })

  it('handles ignore and accessibility regions', async () => {
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })
    wrapper.alwaysMatchResources = true
    wrapper.alwaysMatchDom = true
    const region = {left: 1, top: 2, width: 3, height: 4}
    const region2 = {left: 11, top: 22, width: 33, height: 44, accessibilityType: 'LargeText'}
    checkWindow({
      url: '',
      snapshot: {cdt: []},
      ignore: [region],
      accessibility: [region2],
    })
    const [results] = await close()
    const r = results.getStepsInfo()[0].result
    expect(r.getAsExpected()).to.equal(true)
    expect(r.__checkSettings.ignore).to.eql([region])
    expect(r.__checkSettings.accessibility).to.eql([region2])
  })

  it('handles layout and strict and content regions', async () => {
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })
    wrapper.alwaysMatchResources = true
    wrapper.alwaysMatchDom = true

    const regionLayout = {left: 1, top: 2, width: 3, height: 4}
    const regionStrict = {left: 10, top: 20, width: 30, height: 40}
    const regionContent = {left: 11, top: 21, width: 31, height: 41}
    checkWindow({
      url: '',
      snapshot: {cdt: []},
      layout: [regionLayout],
      strict: [regionStrict],
      content: [regionContent],
    })
    const [results] = await close()
    const r = results.getStepsInfo()[0].result
    expect(r.getAsExpected()).to.equal(true)
    expect(r.__checkSettings.layout).to.eql([regionLayout])
    expect(r.__checkSettings.strict).to.eql([regionStrict])
    expect(r.__checkSettings.content).to.eql([regionContent])
  })

  it('handles ignore, layout, content, accessibility and strict regions with selector', async () => {
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })
    wrapper.alwaysMatchResources = true
    wrapper.alwaysMatchDom = true

    const ignoreSelector1 = {type: 'css', selector: 'sel1'}
    const region1FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel1']
    const region1 = {
      left: region1FromStatusResults.x,
      top: region1FromStatusResults.y,
      width: region1FromStatusResults.width,
      height: region1FromStatusResults.height,
    }

    const layoutSelector1 = {type: 'css', selector: 'sel2'}
    const regionLayout1FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel2']
    const regionLayout1 = {
      left: regionLayout1FromStatusResults.x,
      top: regionLayout1FromStatusResults.y,
      width: regionLayout1FromStatusResults.width,
      height: regionLayout1FromStatusResults.height,
    }

    const strictSelector1 = {type: 'css', selector: 'sel3'}
    const regionStrict1FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel3']
    const regionStrict1 = {
      left: regionStrict1FromStatusResults.x,
      top: regionStrict1FromStatusResults.y,
      width: regionStrict1FromStatusResults.width,
      height: regionStrict1FromStatusResults.height,
    }

    const contentSelector1 = {type: 'css', selector: 'sel9'}
    const regionContent1FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel9']
    const regionContent1 = {
      left: regionContent1FromStatusResults.x,
      top: regionContent1FromStatusResults.y,
      width: regionContent1FromStatusResults.width,
      height: regionContent1FromStatusResults.height,
    }

    const accessibilitySelector1 = {type: 'css', selector: 'sel4', accessibilityType: 'LargeText'}
    const regionAaccessibility1FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel4']
    const regionAccessibility1 = {
      left: regionAaccessibility1FromStatusResults.x,
      top: regionAaccessibility1FromStatusResults.y,
      width: regionAaccessibility1FromStatusResults.width,
      height: regionAaccessibility1FromStatusResults.height,
    }

    const ignoreSelector2 = {type: 'css', selector: 'sel5'}
    const region2FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel5']
    const region2 = {
      left: region2FromStatusResults.x,
      top: region2FromStatusResults.y,
      width: region2FromStatusResults.width,
      height: region2FromStatusResults.height,
    }

    const layoutSelector2 = {type: 'css', selector: 'sel6'}
    const regionLayout2FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel6']
    const regionLayout2 = {
      left: regionLayout2FromStatusResults.x,
      top: regionLayout2FromStatusResults.y,
      width: regionLayout2FromStatusResults.width,
      height: regionLayout2FromStatusResults.height,
    }

    const strictSelector2 = {type: 'css', selector: 'sel7'}
    const regionStrict2FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel7']
    const regionStrict2 = {
      left: regionStrict2FromStatusResults.x,
      top: regionStrict2FromStatusResults.y,
      width: regionStrict2FromStatusResults.width,
      height: regionStrict2FromStatusResults.height,
    }

    const contentSelector2 = {type: 'css', selector: 'sel10'}
    const regionContentFromStatusResults = FakeEyesWrapper.selectorsToLocations['sel10']
    const regionContent2 = {
      left: regionContentFromStatusResults.x,
      top: regionContentFromStatusResults.y,
      width: regionContentFromStatusResults.width,
      height: regionContentFromStatusResults.height,
    }

    const accessibilitySelector2 = {type: 'css', selector: 'sel8', accessibilityType: 'RegularText'}
    const regionAaccessibility2FromStatusResults = FakeEyesWrapper.selectorsToLocations['sel8']
    const regionAccessibility2 = {
      left: regionAaccessibility2FromStatusResults.x,
      top: regionAaccessibility2FromStatusResults.y,
      width: regionAaccessibility2FromStatusResults.width,
      height: regionAaccessibility2FromStatusResults.height,
    }

    checkWindow({
      url: '',
      snapshot: {cdt: []},
      ignore: [ignoreSelector1, ignoreSelector2],
      layout: [layoutSelector1, layoutSelector2],
      strict: [strictSelector1, strictSelector2],
      content: [contentSelector1, contentSelector2],
      accessibility: [accessibilitySelector1, accessibilitySelector2],
    })
    const [results] = await close()
    const r = results.getStepsInfo()[0].result
    expect(r.getAsExpected()).to.equal(true)
    expect(r.__checkSettings.ignore).to.eql([region1, region2])
    expect(r.__checkSettings.layout).to.eql([regionLayout1, regionLayout2])
    expect(r.__checkSettings.strict).to.eql([regionStrict1, regionStrict2])
    expect(r.__checkSettings.content).to.eql([regionContent1, regionContent2])
    expect(r.__checkSettings.accessibility).to.eql([
      {...regionAccessibility1, accessibilityType: accessibilitySelector1.accessibilityType},
      {...regionAccessibility2, accessibilityType: accessibilitySelector2.accessibilityType},
    ])
  })

  it('handles ignore, layout, content, accessibility and strict regions with selector, when target=region and selector', async () => {
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })
    wrapper.alwaysMatchResources = true
    wrapper.alwaysMatchDom = true

    const selector = 'sel1'
    const ignoreRegion = {left: 1, top: 2, width: 3, height: 4}
    const layoutRegion = {left: 10, top: 20, width: 30, height: 40}
    const strictRegion = {left: 100, top: 200, width: 300, height: 400}
    const contentRegion = {left: 101, top: 201, width: 301, height: 401}
    const accessibilityRegion = {
      left: 1000,
      top: 2000,
      width: 3000,
      height: 4000,
      accessibilityType: 'LargeText',
    }
    const ignoreSelector = {type: 'css', selector: 'sel2'}
    const layoutSelector = {type: 'css', selector: 'sel1'}
    const strictSelector = {type: 'css', selector: 'sel3'}
    const contentSelector = {type: 'css', selector: 'sel5'}
    const accessibilitySelector = {type: 'css', selector: 'sel4', accessibilityType: 'RegularText'}
    const imageOffset = FakeEyesWrapper.selectorsToLocations[selector]
    const expectedIgnoreSelectorRegion = FakeEyesWrapper.selectorsToLocations['sel2']
    const expectedLayoutSelectorRegion = FakeEyesWrapper.selectorsToLocations['sel1']
    const expectedStrictSelectorRegion = FakeEyesWrapper.selectorsToLocations['sel3']
    const expectedContentSelectorRegion = FakeEyesWrapper.selectorsToLocations['sel5']
    const expectedAccessibilitySelectorRegion = FakeEyesWrapper.selectorsToLocations['sel4']

    checkWindow({
      url: '',
      snapshot: {cdt: []},
      target: 'selector',
      selector,
      ignore: [ignoreRegion, ignoreSelector],
      layout: [layoutRegion, layoutSelector],
      strict: [strictRegion, strictSelector],
      content: [contentRegion, contentSelector],
      accessibility: [accessibilityRegion, accessibilitySelector],
    })

    const [results] = await close()
    const r = results.getStepsInfo()[0].result
    expect(r.getAsExpected()).to.equal(true)
    expect(r.__checkSettings.ignore).to.eql([
      ignoreRegion,
      {
        left: expectedIgnoreSelectorRegion.x - imageOffset.x,
        top: expectedIgnoreSelectorRegion.y - imageOffset.y,
        width: expectedIgnoreSelectorRegion.width,
        height: expectedIgnoreSelectorRegion.height,
      },
    ])
    expect(r.__checkSettings.layout).to.eql([
      {
        left: expectedLayoutSelectorRegion.x - imageOffset.x,
        top: expectedLayoutSelectorRegion.y - imageOffset.y,
        width: expectedLayoutSelectorRegion.width,
        height: expectedLayoutSelectorRegion.height,
      },
      layoutRegion,
    ])
    expect(r.__checkSettings.content).to.eql([
      contentRegion,
      {
        left: expectedContentSelectorRegion.x - imageOffset.x,
        top: expectedContentSelectorRegion.y - imageOffset.y,
        width: expectedContentSelectorRegion.width,
        height: expectedContentSelectorRegion.height,
      },
    ])
    expect(r.__checkSettings.strict).to.eql([
      {
        left: expectedStrictSelectorRegion.x - imageOffset.x,
        top: expectedStrictSelectorRegion.y - imageOffset.y,
        width: expectedStrictSelectorRegion.width,
        height: expectedStrictSelectorRegion.height,
      },
      strictRegion,
    ])
    expect(r.__checkSettings.accessibility).to.eql([
      {
        left: expectedAccessibilitySelectorRegion.x - imageOffset.x,
        top: expectedAccessibilitySelectorRegion.y - imageOffset.y,
        width: expectedAccessibilitySelectorRegion.width,
        height: expectedAccessibilitySelectorRegion.height,
        accessibilityType: 'RegularText',
      },
      {...accessibilityRegion, accessibilityType: 'LargeText'},
    ])
  })

  it('handles ignore, layout, content, accessibility and strict regions with selector and floating regions with selector, when target=region and selector', async () => {
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })
    wrapper.alwaysMatchResources = true
    wrapper.alwaysMatchDom = true

    const selector = 'sel1'
    const ignoreRegion = {left: 1, top: 2, width: 3, height: 4}
    const layoutRegion = {left: 10, top: 20, width: 30, height: 40}
    const strictRegion = {left: 100, top: 200, width: 300, height: 400}
    const contentRegion = {left: 101, top: 201, width: 301, height: 401}
    const accessibilityRegion = {
      left: 1000,
      top: 2000,
      width: 3000,
      height: 4000,
      accessibilityType: 'LargeText',
    }
    const ignoreSelector = {type: 'css', selector: 'sel2'}
    const layoutSelector = {type: 'css', selector: 'sel1'}
    const strictSelector = {type: 'css', selector: 'sel3'}
    const contentSelector = {type: 'css', selector: 'sel5'}
    const accessibilitySelector = {type: 'css', selector: 'sel4', accessibilityType: 'RegularText'}
    const imageOffset = FakeEyesWrapper.selectorsToLocations[selector]
    const expectedIgnoreSelectorRegion = FakeEyesWrapper.selectorsToLocations['sel2']
    const expectedLayoutSelectorRegion = FakeEyesWrapper.selectorsToLocations['sel1']
    const expectedStrictSelectorRegion = FakeEyesWrapper.selectorsToLocations['sel3']
    const expectedContentSelectorRegion = FakeEyesWrapper.selectorsToLocations['sel5']
    const expectedAccessibilitySelectorRegion = FakeEyesWrapper.selectorsToLocations['sel4']

    const floatingRegion = {
      left: 10,
      top: 11,
      width: 12,
      height: 13,
      maxUpOffset: 14,
      maxDownOffset: 15,
      maxLeftOffset: 16,
      maxRightOffset: 17,
    }

    const expectedFloatingRegion = FakeEyesWrapper.selectorsToLocations['sel3']
    const floatingSelector = {
      type: 'css',
      selector: 'sel3',
      maxUpOffset: 18,
      maxDownOffset: 19,
      maxLeftOffset: 20,
      maxRightOffset: 21,
    }

    checkWindow({
      url: '',
      snapshot: {cdt: []},
      target: 'selector',
      selector,
      ignore: [ignoreRegion, ignoreSelector],
      layout: [layoutRegion, layoutSelector],
      strict: [strictRegion, strictSelector],
      content: [contentRegion, contentSelector],
      accessibility: [accessibilityRegion, accessibilitySelector],
      floating: [floatingRegion, floatingSelector],
    })

    const [results] = await close()
    const r = results.getStepsInfo()[0].result
    expect(r.getAsExpected()).to.equal(true)
    expect(r.__checkSettings.ignore).to.eql([
      ignoreRegion,
      {
        left: expectedIgnoreSelectorRegion.x - imageOffset.x,
        top: expectedIgnoreSelectorRegion.y - imageOffset.y,
        width: expectedIgnoreSelectorRegion.width,
        height: expectedIgnoreSelectorRegion.height,
      },
    ])
    expect(r.__checkSettings.layout).to.eql([
      {
        left: expectedLayoutSelectorRegion.x - imageOffset.x,
        top: expectedLayoutSelectorRegion.y - imageOffset.y,
        width: expectedLayoutSelectorRegion.width,
        height: expectedLayoutSelectorRegion.height,
      },
      layoutRegion,
    ])
    expect(r.__checkSettings.content).to.eql([
      contentRegion,
      {
        left: expectedContentSelectorRegion.x - imageOffset.x,
        top: expectedContentSelectorRegion.y - imageOffset.y,
        width: expectedContentSelectorRegion.width,
        height: expectedContentSelectorRegion.height,
      },
    ])
    expect(r.__checkSettings.strict).to.eql([
      {
        left: expectedStrictSelectorRegion.x - imageOffset.x,
        top: expectedStrictSelectorRegion.y - imageOffset.y,
        width: expectedStrictSelectorRegion.width,
        height: expectedStrictSelectorRegion.height,
      },
      strictRegion,
    ])
    expect(r.__checkSettings.accessibility).to.eql([
      {
        left: expectedAccessibilitySelectorRegion.x - imageOffset.x,
        top: expectedAccessibilitySelectorRegion.y - imageOffset.y,
        width: expectedAccessibilitySelectorRegion.width,
        height: expectedAccessibilitySelectorRegion.height,
        accessibilityType: accessibilitySelector.accessibilityType,
      },
      accessibilityRegion,
    ])

    expect(r.__checkSettings.floating).to.eql([
      floatingRegion,
      {
        left: expectedFloatingRegion.x - imageOffset.x,
        top: expectedFloatingRegion.y - imageOffset.y,
        width: expectedFloatingRegion.width,
        height: expectedFloatingRegion.height,
        maxUpOffset: floatingSelector.maxUpOffset,
        maxDownOffset: floatingSelector.maxDownOffset,
        maxLeftOffset: floatingSelector.maxLeftOffset,
        maxRightOffset: floatingSelector.maxRightOffset,
      },
    ])
  })

  it('handles useDom and enablePatterns', async () => {
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })
    wrapper.alwaysMatchDom = true
    wrapper.alwaysMatchResources = true

    checkWindow({
      url: '',
      snapshot: {cdt: []},
      useDom: true,
      enablePatterns: false,
      ignoreDisplacements: false,
    })
    checkWindow({url: '', snapshot: {cdt: []}})
    const [results] = await close()
    const r = results.getStepsInfo()[0].result
    const r2 = results.getStepsInfo()[1].result
    expect(r.__checkSettings.useDom).to.be.true
    expect(r.__checkSettings.enablePatterns).to.be.false
    expect(r.__checkSettings.ignoreDisplacements).to.be.false
    expect(r2.__checkSettings.useDom).to.be.undefined
    expect(r2.__checkSettings.enablePatterns).to.be.undefined
    expect(r2.__checkSettings.ignoreDisplacements).to.be.undefined
  })

  it('handles abort', async () => {
    const wrapper1 = createFakeWrapper(baseUrl)
    const wrapper2 = createFakeWrapper(baseUrl)
    const {abort} = await openEyes({
      wrappers: [wrapper1, wrapper2],
      browser: [
        {width: 1, height: 2},
        {width: 3, height: 4},
      ],
      appName,
    })

    await abort()
    expect(wrapper1.aborted).to.equal(true)
    expect(wrapper2.aborted).to.equal(true)
  })

  it('handles abort by waiting for checkWindow to end', async () => {
    const wrapper1 = createFakeWrapper(baseUrl)
    const {checkWindow, abort} = await openEyes({
      wrappers: [wrapper1],
      browser: [{width: 1, height: 2}],
      appName,
    })

    let done
    const donePromise = new Promise(res => {
      done = res
      setTimeout(done, 1000)
    })

    let checkEndedAfterAbort = false
    wrapper1.on('checkWindowEnd', () => {
      checkEndedAfterAbort = aborted
      done()
    })
    let aborted = false
    wrapper1.on('aborted', () => {
      aborted = true
    })

    await checkWindow({url: '', snapshot: {cdt: []}})
    await abort()
    await donePromise
    expect(checkEndedAfterAbort).to.be.false
  })

  it('handles abort by waiting for open to end', async () => {
    const wrapper1 = createFakeWrapper(baseUrl)
    wrapper1.checkWindow = () => {
      throw new Error('CHECK_WINDOW NOT WAITING FOR OPEN SINCE THREW ERROR')
    }
    const {checkWindow, abort} = await openEyes({
      wrappers: [wrapper1],
      browser: [{width: 1, height: 2}],
      appName,
    })

    let done
    const donePromise = new Promise(res => {
      done = res
      setTimeout(done, 1000)
    })

    let openEndedAfterAbort = false
    wrapper1.on('openEnd', () => {
      openEndedAfterAbort = aborted
      done()
    })
    let aborted = false
    wrapper1.on('aborted', () => {
      aborted = true
    })

    await checkWindow({url: '', snapshot: {cdt: []}})
    await abort()
    await donePromise
    expect(openEndedAfterAbort).to.be.false
  })

  it('adds "safari" browser name and "ios" platform if "iosDeviceInfo" is defined', async () => {
    const deviceName = 'iPhone 4'
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      browser: {
        iosDeviceInfo: {screenOrientation: 'portrait', version: 'latest', deviceName},
      },
      appName,
    })
    wrapper.alwaysMatchDom = true
    wrapper.alwaysMatchResources = true

    checkWindow({url: '', snapshot: {cdt: []}})
    const [results] = await close()
    expect(wrapper.results[0].__browserName).to.equal('safari')
    expect(wrapper.results[0].__platform).to.eql({type: 'web', name: 'ios'})
    expect(wrapper.getDeviceInfo()).to.equal(deviceName)
    expect(results.getStepsInfo()[0].result.getAsExpected()).to.equal(true)
  })

  it('handles iframes', async () => {
    const frameUrl = `${baseUrl}/test.html`
    const frames = [
      {
        url: frameUrl,
        cdt: loadJsonFixture('test.cdt.json'),
        resourceUrls: wrapper.goodResourceUrls,
        resourceContents: wrapper.goodResources,
      },
    ]
    wrapper.alwaysMatchDom = true
    wrapper.alwaysMatchResources = true

    const url = `${baseUrl}/inner-frame.html`

    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })
    checkWindow({snapshot: {cdt: [], frames}, url})
    const ttt = await close()
    expect(ttt[0].getStepsInfo().map(r => r.result.getAsExpected())).to.eql([true])
  })

  it('handles empty tests', async () => {
    openEyes = makeRenderingGridClient({
      testConcurrency: 1,
      apiKey,
      showLogs: APPLITOOLS_SHOW_LOGS,
      renderWrapper: wrapper,
    }).openEyes

    const {close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })

    const {close: close2} = await openEyes({
      wrappers: [wrapper],
      appName,
    })

    const promise = presult(close2()).then(([err, result]) => {
      expect(err).to.be.undefined
      expect(result).not.to.be.an.instanceOf(Error)
    })

    await psetTimeout(50)
    const [err, result] = await presult(close())
    expect(err).to.be.undefined
    expect(result).not.to.be.an.instanceOf(Error)
    await promise
  })

  // ----

  it('sets matchLevel in checkWindow', async () => {
    wrapper.checkWindow = async ({tag, checkSettings}) => {
      await psetTimeout(20)
      if (tag === 2) {
        expect(checkSettings.matchLevel).to.equal('Layout')
      } else {
        expect(wrapper.getMatchLevel()).to.equal('Strict')
      }
      wrapper.setDummyTestResults()
    }
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
    })
    checkWindow({tag: 1, snapshot: {cdt: []}, url: ''})
    await psetTimeout(0)
    checkWindow({matchLevel: 'Layout', tag: 2, snapshot: {cdt: []}, url: ''})
    await psetTimeout(0)
    checkWindow({tag: 3, snapshot: {cdt: []}, url: ''})
    await close()
  })

  it('sets matchLevel in checkWindow and override argument to openEyes', async () => {
    wrapper.checkWindow = async ({tag, checkSettings}) => {
      await psetTimeout(20)
      if (tag === 2) {
        expect(checkSettings.matchLevel).to.equal('Layout')
      } else {
        expect(wrapper.getMatchLevel()).to.equal('Content')
      }
      wrapper.setDummyTestResults()
    }
    const {checkWindow, close} = await openEyes({
      wrappers: [wrapper],
      appName,
      matchLevel: 'Content',
    })
    checkWindow({tag: 1, snapshot: {cdt: []}, url: ''})
    await psetTimeout(0)
    checkWindow({matchLevel: 'Layout', tag: 2, snapshot: {cdt: []}, url: ''})
    await psetTimeout(0)
    checkWindow({tag: 3, snapshot: {cdt: []}, url: ''})
    await close()
  })

  it('sets matchLevel in checkWindow and override argument to makeRenderingGridClient', async () => {
    openEyes = makeRenderingGridClient({
      apiKey,
      showLogs: APPLITOOLS_SHOW_LOGS,
      renderWrapper: wrapper,
      matchLevel: 'Content',
    }).openEyes

    wrapper.checkWindow = async ({tag, checkSettings}) => {
      await psetTimeout(20)
      if (tag === 2) {
        expect(checkSettings.matchLevel).to.equal('Layout')
      } else {
        expect(wrapper.getMatchLevel()).to.equal('Content')
      }
      wrapper.setDummyTestResults()
    }
    const {checkWindow, close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
    })
    checkWindow({tag: 1, snapshot: {cdt: []}, url: ''})
    await psetTimeout(0)
    checkWindow({matchLevel: 'Layout', tag: 2, snapshot: {cdt: []}, url: ''})
    await psetTimeout(0)
    checkWindow({tag: 3, snapshot: {cdt: []}, url: ''})
    await close()
  })

  it('sets useDom & enablePatterns in makeRenderingGridClient', async () => {
    openEyes = makeRenderingGridClient({
      apiKey,
      showLogs: APPLITOOLS_SHOW_LOGS,
      renderWrapper: wrapper,
      useDom: true,
      enablePatterns: true,
    }).openEyes
    const {close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
    })

    expect(wrapper.getUseDom()).to.be.true
    expect(wrapper.getEnablePatterns()).to.be.true
    await close()
  })

  it('has correct default value for useDom & enablePatterns', async () => {
    openEyes = makeRenderingGridClient({
      apiKey,
      showLogs: APPLITOOLS_SHOW_LOGS,
      renderWrapper: wrapper,
    }).openEyes
    const {close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
    })

    expect(wrapper.getUseDom()).to.be.undefined
    expect(wrapper.getEnablePatterns()).to.be.undefined
    await close()
  })

  it('has correct values for useDom & enablePatterns', async () => {
    openEyes = makeRenderingGridClient({
      testConcurrency: 500,
      apiKey,
      showLogs: APPLITOOLS_SHOW_LOGS,
      renderWrapper: wrapper,
      useDom: false,
      enablePatterns: false,
    }).openEyes
    const {close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
    })

    expect(wrapper.getUseDom()).to.be.false
    expect(wrapper.getEnablePatterns()).to.be.false
    await close()
  })

  it('openEyes overrides useDom & enablePatterns', async () => {
    openEyes = makeRenderingGridClient({
      apiKey,
      showLogs: APPLITOOLS_SHOW_LOGS,
      renderWrapper: wrapper,
      useDom: false,
      enablePatterns: false,
    }).openEyes
    const {close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
      useDom: true,
      enablePatterns: true,
    })

    expect(wrapper.getUseDom()).to.be.true
    expect(wrapper.getEnablePatterns()).to.be.true
    await close()
  })

  it('checkWindow overrides openEyes useDom & enablePatterns', async () => {
    openEyes = makeRenderingGridClient({
      apiKey,
      showLogs: APPLITOOLS_SHOW_LOGS,
      renderWrapper: wrapper,
      useDom: false,
      enablePatterns: false,
    }).openEyes

    wrapper.alwaysMatchDom = true
    wrapper.alwaysMatchResources = true

    const {checkWindow, close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
      useDom: false,
      enablePatterns: false,
    })

    let done
    const donePromise = new Promise(res => {
      done = res
      setTimeout(done, 1000)
    })
    wrapper.on('checkWindowEnd', done)

    await checkWindow({
      snapshot: {cdt: []},
      url: '',
      tag: 'good1',
      useDom: true,
      enablePatterns: true,
    })
    await donePromise
    const [results] = await close()
    const r = results.getStepsInfo()[0].result
    expect(r.__checkSettings.useDom).to.be.true
    expect(r.__checkSettings.enablePatterns).to.be.true
  })

  it('checkWindow overrides openEyes useDom & enablePatterns with false', async () => {
    openEyes = makeRenderingGridClient({
      apiKey,
      showLogs: APPLITOOLS_SHOW_LOGS,
      renderWrapper: wrapper,
      useDom: true,
      enablePatterns: true,
    }).openEyes

    wrapper.alwaysMatchDom = true
    wrapper.alwaysMatchResources = true

    const {checkWindow, close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
      useDom: true,
      enablePatterns: true,
    })

    let done
    const donePromise = new Promise(res => {
      done = res
      setTimeout(done, 1000)
    })
    wrapper.on('checkWindowEnd', done)

    await checkWindow({
      snapshot: {cdt: []},
      url: '',
      tag: 'good1',
      useDom: false,
      enablePatterns: false,
    })
    await donePromise
    const [results] = await close()
    const r = results.getStepsInfo()[0].result
    expect(r.__checkSettings.useDom).to.be.false
    expect(r.__checkSettings.enablePatterns).to.be.false
  })

  it('handles visualGridOptions in checkWindow', async () => {
    openEyes = makeRenderingGridClient({
      apiKey,
      renderWrapper: wrapper,
    }).openEyes

    wrapper.alwaysMatchDom = true
    wrapper.alwaysMatchResources = true

    const {checkWindow, close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
    })

    await checkWindow({
      snapshot: {cdt: []},
      url: '',
      visualGridOptions: {aaa: true},
    })
    const [results] = await close()
    const r = results.getStepsInfo()[0].getRenderId()
    expect(JSON.parse(r).visualGridOptions).to.eql({aaa: true})
  })

  it('handles selector as array in checkWindow', async () => {
    openEyes = makeRenderingGridClient({
      apiKey,
      renderWrapper: wrapper,
    }).openEyes

    wrapper.alwaysMatchDom = true
    wrapper.alwaysMatchResources = true

    const {checkWindow, close} = await openEyes({
      apiKey,
      wrappers: [wrapper],
      appName,
    })

    await checkWindow({
      snapshot: {cdt: []},
      url: '',
      visualGridOptions: {aaa: true},
      selector: ['.something-1', '.something-2'],
    })
    await close()

    expect(wrapper.selector).to.eql(['.something-1', '.something-2'])
  })
})

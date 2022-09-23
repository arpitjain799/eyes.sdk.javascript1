import {makeCore} from '../../../src/classic/core'
import * as spec from '@applitools/spec-driver-webdriverio'
import assert from 'assert'

describe('webview', () => {
  let driver, destroyDriver

  beforeEach(async () => {
    ;[driver, destroyDriver] = await spec.build({
      device: 'iPhone 12',
      app: 'https://applitools.jfrog.io/artifactory/Examples/IOSTestApp/1.9/app/IOSTestApp.zip',
    })
  })

  afterEach(async () => {
    await destroyDriver?.()
  })

  it('specified in check settings', async () => {
    await driver.$('xpath://XCUIElementTypeStaticText[@name="Web view"]').click()

    const core = makeCore({spec})

    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY,
        appName: 'core app',
        testName: 'webview',
      },
    })

    await eyes.check({
      settings: {webview: true}, // can alternatively specify a string of the webview id (if known) - e.g., {webview: 'webview-id'}
    })
    const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})

    assert.strictEqual(result.status, 'Passed')
  })

  it('user switches to webview in their test (not specified in check settings)', async () => {
    await driver.$('xpath://XCUIElementTypeStaticText[@name="Web view"]').click()
    const [, webview] = await driver.getContexts()
    await driver.switchContext(webview)

    const core = makeCore({spec})

    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY,
        appName: 'core app',
        testName: 'webview',
      },
    })

    await eyes.check({})
    const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})

    assert.strictEqual(result.status, 'Passed')
  })

  it('restores focus to the native app after performing a check (when specified as part of check settings)', async () => {
    await driver.$('xpath://XCUIElementTypeStaticText[@name="Web view"]').click()

    const core = makeCore({spec})

    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY,
        appName: 'core app',
        testName: 'webview + native app',
      },
    })

    await eyes.check({
      settings: {webview: true},
    })
    await driver.back()
    await eyes.check({})
    const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})

    assert.strictEqual(result.status, 'Passed')
  })


  it('has a helpful error when attempting to switch to a webview id that does not exist', async () => {
    await driver.$('xpath://XCUIElementTypeStaticText[@name="Web view"]').click()

    const core = makeCore({spec})

    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY,
        appName: 'core app',
        testName: 'webview + native app',
      },
    })
    assert.rejects(
      async () => {await eyes.check({settings: {webview: 'invalid-webview-id'}})},
      err => err.message.startsWith('Unable to switch worlds')
    )
    await eyes.abort()
  })
})

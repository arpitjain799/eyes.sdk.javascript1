import {makeCore} from '../../../src/classic/core'
import * as spec from '@applitools/spec-driver-webdriverio'
import assert from 'assert'

describe.skip('lock screen', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await spec.build({
      device: 'iPhone 12',
      app: 'https://applitools.jfrog.io/artifactory/Examples/IOSTestApp/1.9/app/IOSTestApp.zip',
    })
  })

  after(async () => {
    await destroyDriver?.()
  })

  it('does not prevent check from completing', async () => {
    const core = makeCore({spec})

    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY,
        appName: 'core app',
        testName: 'lock screen',
      },
    })

    await driver.lock()
    const isLocked = await driver.isLocked()
    assert.ok(isLocked)

    await driver.unlock()
    const isUnlocked = !(await driver.isLocked())
    assert.ok(isUnlocked)

    await eyes.check({
      settings: {
        region: '//XCUIElementTypeStaticText[@name="Table view"]'
      }
    })
    //await eyes.check({})

    const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})
    assert.strictEqual(result.status, 'Passed')
  })

})

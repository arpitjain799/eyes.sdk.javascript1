import {makeCore} from '../../../src/ufg/core'
import {By} from 'selenium-webdriver'
import * as spec from '@applitools/spec-driver-selenium'
import assert from 'assert'

describe('openEyes UFG', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
  })

  after(async () => {
    await destroyDriver?.()
  })

  it('should preserve original frame after opening', async () => {
    const core = makeCore({spec, concurrency: 10})

    await driver.get('https://applitools.github.io/demo/TestPages/FramesTestPage/')
    const frame1 = await driver.findElement(By.css('[name="frame1"]'))
    await driver.switchTo().frame(frame1)
    const innerFrameDiv = await driver.findElement(By.css('#inner-frame-div'))

    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY,
        appName: 'core e2e',
        testName: 'ufg - should preserve original frame after opening',
        environment: {viewportSize: {width: 700, height: 460}},
      },
    })

    await eyes.check({
      settings: {
        region: innerFrameDiv,
        fully: true,
        lazyLoad: true,
        layoutBreakpoints: true,
        renderers: [{name: 'chrome', width: 1000, height: 600}],
      },
    })

    const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})
    assert.strictEqual(result.status, 'Passed')
  })
})

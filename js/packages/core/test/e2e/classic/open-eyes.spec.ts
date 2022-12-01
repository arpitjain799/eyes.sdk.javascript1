import {makeCore} from '../../../src/classic/core'
import {By} from 'selenium-webdriver'
import * as spec from '@applitools/spec-driver-selenium'
import assert from 'assert'

describe('openEyes classic', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
  })

  after(async () => {
    await destroyDriver?.()
  })

  it('should preserve original frame after opening', async () => {
    const core = makeCore<spec.Driver, spec.Driver, spec.Element, spec.Selector>({spec})

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
        testName: 'should preserve original frame after opening',
        environment: {viewportSize: {width: 700, height: 460}},
      },
    })

    await eyes.check({
      settings: {
        name: 'layout region screenshot',
        region: innerFrameDiv,
        fully: true,
        ignoreCaret: true,
        layoutRegions: ['#inner'],
        matchLevel: 'Strict',
      },
    })

    const [result] = await eyes.close()
    assert.strictEqual(result.status, 'Passed')
  })
})

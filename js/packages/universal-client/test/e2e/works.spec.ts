import {Eyes} from '../../src/webdriver'
import {VisualGridRunner} from '@applitools/eyes-api'
import * as spec from '@applitools/spec-driver-selenium'
import assert from 'assert'

describe('works', () => {
  let driver: spec.Driver, destroyDriver: () => Promise<void>
  beforeEach(async () => {
    ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
    await driver.get('https://applitools.github.io/demo/TestPages/FramesTestPage/index.html')
  })
  afterEach(async () => {
    await destroyDriver()
  })

  it('work with cli', async () => {
    const eyes = new Eyes(new VisualGridRunner({testConcurrency: 1}))
    const config = {
      appName: 'universal-client',
      testName: 'working with cli',
      saveNewTests: false,
    }
    await eyes.open(driver, config)
    await eyes.check()
    const result = await eyes.close()
    assert.strictEqual(result.status, 'Passed')
  })
})

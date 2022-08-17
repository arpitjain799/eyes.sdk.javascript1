import {Eyes} from '../../src/webdriver'
import {VisualGridRunner} from '@applitools/eyes-api'
import type {Driver} from '@applitools/spec-driver-selenium'
import * as spec from '@applitools/spec-driver-selenium'

async function runSingleTest() {
  const [driver, stopDriver]: [Driver, () => Promise<void>] = await spec.build({browser: 'chrome'})
  await driver.get('https://applitools.github.io/demo/TestPages/FramesTestPage/index.html')
  const eyes = new Eyes(new VisualGridRunner({testConcurrency: 1}))
  const config = {
    appName: 'testme!',
    testName: 'universal e2e test',
    saveNewTests: false,
  }
  await eyes.open(driver, config)
  await eyes.check()
  await eyes.close()
  await stopDriver()
}

;(async () => {
  await runSingleTest()
})()

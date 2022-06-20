import {UniversalClient} from './utils/universal-client'
import * as spec from '@applitools/spec-driver-selenium'
import * as assert from 'assert'

describe('Universal server', () => {
  before(async () => {
    await UniversalClient.killServer()
  })

  describe('Web', () => {
    let driver, destroyDriver, client

    beforeEach(async () => {
      ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
      await driver.get('https://applitools.github.io/demo/TestPages/FramesTestPage/')

      client = new UniversalClient()
    })

    afterEach(async () => {
      await destroyDriver()
      await client.closeServer()
    })

    let timeoutId
    beforeEach(() => {
      timeoutId = setTimeout(() => console.log('ugly hack'), 1000000)
    })
    afterEach(() => {
      clearTimeout(timeoutId)
    })

    it('works', async () => {
      const config = {
        appName: 'universal e2e tests',
        testName: 'universal e2e test',
        saveNewTests: false,
        // browsersInfo: [{androidDeviceInfo: {deviceName: 'Pixel 4 XL', androidVersion: 'latest'}}],
      }
      // const manager = await client.makeManager({type: 'vg', concurrency: 5})
      const manager = await client.makeManager({})
      const eyes = await manager.openEyes({driver, config})
      await eyes.check({
        settings: {ignoreRegions: [{region: '#overflowing-div', padding: {left: 10, top: 20, right: 30, bottom: 40}}]},
      })
      const results = await eyes.close({throwErr: false})
      assert.strictEqual(results[0].status, 'Passed')
      const allResults = await manager.closeManager({throwErr: false})
      assert.strictEqual(allResults.results[0].testResults.status, 'Passed')
    })
  })

  describe.skip('Android', () => {
    let driver, destroyDriver, client

    beforeEach(async () => {
      client = new UniversalClient({driverType: 'sauce'})
      ;[driver, destroyDriver] = await spec.build({
        device: 'Pixel 3 XL',
        app: 'https://applitools.jfrog.io/artifactory/Examples/runnerup_multiple_checks.apk',
      })
    })

    afterEach(async () => {
      await destroyDriver()
    })
    it('works', async () => {
      const timeoutId = setTimeout(() => console.log('ugly hack'), 1000000)

      const config = {
        appName: 'universal e2e tests',
        testName: 'universal e2e test',
        saveNewTests: false,
        browsersInfo: [{androidDeviceInfo: {deviceName: 'Pixel 4 XL', androidVersion: 'latest'}}],
      }
      const manager = await client.makeManager({type: 'vg', concurrency: 5})
      const eyes = await manager.openEyes({driver, config})
      await eyes.check({settings: {}})
      const results = await eyes.close({throwErr: false})
      assert.strictEqual(results[0].status, 'Passed')

      const allResults = await manager.closeManager({throwErr: false})
      assert.strictEqual(allResults.results[0].testResults.status, 'Passed')
      clearTimeout(timeoutId)
    })
  })
})

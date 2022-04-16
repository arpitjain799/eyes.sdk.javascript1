import {UniversalClient} from './utils/universal-client'
import * as spec from '@applitools/spec-driver-selenium'
import {exec} from 'child_process'
import {promisify} from 'util'
const pexec = promisify(exec)

describe.only('Universal server', () => {
  describe('Web', () => {
    let driver, destroyDriver, client

    beforeEach(async () => {
      const pid = (await pexec('lsof -ti :21077').catch(() => ({stdout: ''}))).stdout.trim()
      if (pid) {
        await pexec(`kill -9 ${pid}`)
      }
      ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
      await driver.get('https://example.org')

      client = new UniversalClient()
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
        // browsersInfo: [{androidDeviceInfo: {deviceName: 'Pixel 4 XL', androidVersion: 'latest'}}],
      }
      const manager = await client.makeManager({type: 'vg', concurrency: 5})
      const eyes = await manager.openEyes({driver, config})
      await eyes.check({settings: {}})
      const results = await eyes.close({throwErr: false})
      console.log(results)
      const allResults = await manager.closeManager({throwErr: false})
      console.log(allResults)
      clearTimeout(timeoutId)
    })
  })

  describe('Android', () => {
    let driver, destroyDriver, client

    beforeEach(async () => {
      const pid = (await pexec('lsof -ti :21077').catch(() => ({stdout: ''}))).stdout.trim()
      if (pid) {
        await pexec(`kill -9 ${pid}`)
      }

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
      console.log(results)
      const allResults = await manager.closeManager({throwErr: false})
      console.log(allResults)
      clearTimeout(timeoutId)
    })
  })
})

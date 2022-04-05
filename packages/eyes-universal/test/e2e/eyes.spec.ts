import {UniversalClient} from './utils/universal-client'
import * as spec from '@applitools/spec-driver-selenium'

describe.only('Universal server', () => {
  let driver, destroyDriver

  before(async () => {
    // ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
    // await driver.get('https://example.org')

    console.log('#### 1')
    ;[driver, destroyDriver] = await spec.build({
      device: 'Pixel 3 XL',
      app: 'https://applitools.jfrog.io/artifactory/Examples/ufg-native-example.apk',
    })
    console.log('#### 2')
  })

  after(async () => {
    await destroyDriver()
  })
  it('works', async () => {
    const timeoutId = setTimeout(() => console.log('ugly hack'), 1000000)
    const client = new UniversalClient()

    const config = {
      appName: 'universal e2e tests',
      testName: 'universal e2e test',
      saveNewTests: false,
      browsersInfo: [{androidDeviceInfo: {deviceName: 'Pixel 4 XL', androidVersion: 'latest'}}],
    }
    console.log('111')
    const manager = await client.makeManager({type: 'vg', concurrency: 5})
    console.log('222')
    const eyes = await manager.openEyes({driver, config})
    await eyes.check({settings: {}})
    const results = await eyes.close({throwErr: false})
    console.log(results)
    const allResults = await manager.closeManager({throwErr: false})
    console.log(allResults)
    clearTimeout(timeoutId)
  })
})

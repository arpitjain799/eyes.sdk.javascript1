const VisualGridClient = require('@applitools/visual-grid-client')
const spec = require('@applitools/spec-driver-selenium')
const makeSDK = require('../../lib/new/sdk')

describe('UFG native', () => {
  let driver, destroyDriver, sdk, manager

  before(async () => {
    sdk = makeSDK({
      name: 'eyes-core',
      version: require('../../package.json').version,
      spec,
      VisualGridClient,
    })
    manager = await sdk.makeManager({type: 'vg', concurrency: 5})
  })

  after(async () => {
    if (destroyDriver) await destroyDriver()
  })

  describe('Android', () => {
    before(async () => {
      ;[driver, destroyDriver] = await spec.build({
        device: 'Android emulator ufg native',
      })
    })

    it('works', async () => {
      const config = {
        appName: 'core app',
        testName: 'native ufg android',
        waitBeforeCapture: 1500,
        browsersInfo: [{androidDeviceInfo: {deviceName: 'Pixel 4 XL', androidVersion: 'latest'}}],
        saveNewTests: false,
      }
      const eyes = await manager.openEyes({driver, config})
      await eyes.check()
      await eyes.close({throwErr: true})
    })
  })

  describe('iOS', () => {
    before(async () => {
      ;[driver, destroyDriver] = await spec.build({
        device: 'iPhone 12 ufg native',
      })
    })

    it('works', async () => {
      const config = {
        appName: 'core app',
        testName: 'native ufg ios',
        waitBeforeCapture: 1500,
        browsersInfo: [{iosDeviceInfo: {deviceName: 'iPhone 12', iosVersion: 'latest'}}],
        saveNewTests: false,
      }
      const eyes = await manager.openEyes({driver, config})
      //await driver
      //  .switchTo()
      //  .alert()
      //  .dismiss()
      await eyes.check()
      await eyes.close({throwErr: true})
    })
  })
})

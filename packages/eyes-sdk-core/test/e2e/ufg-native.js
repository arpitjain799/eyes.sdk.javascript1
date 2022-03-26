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
        browsersInfo: [{androidDeviceInfo: {name: 'Pixel 4 XL', version: 'latest'}}],
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

  describe.skip('iOS', () => {
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
        browsersInfo: [{iosDeviceInfo: {name: 'iPhone 12', version: 'latest'}}],
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

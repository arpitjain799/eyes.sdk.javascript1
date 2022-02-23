const utils = require('@applitools/utils')
const {makeLogger} = require('@applitools/logger')
const {Driver} = require('@applitools/driver')
const VisualGridClient = require('@applitools/visual-grid-client')
const spec = require('@applitools/spec-driver-selenium')
const makeSDK = require('../../lib/new/sdk')

describe('check e2e', () => {
  const logger = makeLogger()
  let driver, destroyDriver, sdk, manager

  before(async () => {
    ;[driver, destroyDriver] = await spec.build({
      url: 'http://0.0.0.0:4723/wd/hub',
      // capabilities: {
      //   browserName: '',
      //   app: '/Users/kyrylo/Downloads/App for testing UFG mobile native/With UFG_lib/UIKitCatalog.app',
      //   deviceName: 'iPhone 12',
      //   platformName: 'iOS',
      //   platformVersion: '15.2',
      //   automationName: 'XCUITest',
      //   processArguments: {
      //     args: [],
      //     env: {
      //       DYLD_INSERT_LIBRARIES:
      //         '@executable_path/Frameworks/UFG_lib.xcframework/ios-arm64_x86_64-simulator/UFG_lib.framework/UFG_lib',
      //     },
      //   },
      // },
      capabilities: {
        avd: 'pixel_3a_xl_5555',
        browserName: '',
        app: '/Users/kyrylo/Downloads/app-latest-debug.apk',
        deviceName: 'Google Pixel 3a XL',
        platformName: 'Android',
        platformVersion: '10.0',
        automationName: 'uiautomator2',
      },
    })
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

  it('works', async () => {
    const config = {
      appName: 'core app',
      testName: 'native ufg android',
      waitBeforeCapture: 1500,
      browsersInfo: [{androidDeviceInfo: {name: 'Pixel 4 XL', version: 'latest'}}],
    }
    const eyes = await manager.openEyes({driver, config})
    await driver
      .switchTo()
      .alert()
      .dismiss()
    await eyes.check()
    await eyes.close({throwErr: true})
  })
})

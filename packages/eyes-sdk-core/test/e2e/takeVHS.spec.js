const utils = require('@applitools/utils')
const {makeLogger} = require('@applitools/logger')
const {Driver} = require('@applitools/driver')
const spec = require('@applitools/spec-driver-selenium')
const takeVHS = require('../../lib/utils/takeVHS')

describe('check e2e', () => {
  const logger = makeLogger()
  let driver, destroyDriver

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
  })

  after(async () => {
    if (destroyDriver) await destroyDriver()
  })

  it('works', async () => {
    const d = await new Driver({driver, spec, logger}).init()
    await utils.general.sleep(5000)
    await d.target
      .switchTo()
      .alert()
      .dismiss()
    await takeVHS({context: d.mainContext, apiKey: process.env.APPLITOOLS_API_KEY, logger})
  })
})

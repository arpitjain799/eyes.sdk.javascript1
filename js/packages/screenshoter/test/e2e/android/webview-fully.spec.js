const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter android app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'android', logger, platformVersion: '11.0', deviceName: 'Pixel_3a_API_33_arm64-v8a'})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full webview screenshot', async () => {
    const button = await driver.element({type: 'id', selector: 'com.applitools.eyes.android:id/btn_web_view'})
    await button.click()
    await driver.switchToWebView()

    await test({
      type: 'android',
      tag: 'webview-fully',
      fully: true,
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
    })
  })
})

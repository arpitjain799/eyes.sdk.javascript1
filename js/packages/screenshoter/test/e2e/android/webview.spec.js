const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter ios app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'android', logger, platformVersion: '11.0', deviceName: 'Pixel_3a_API_33_arm64-v8a'})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take webview screenshot', async () => {
    const button = await driver.element({type: 'id', selector: 'com.applitools.eyes.android:id/btn_web_view'})
    console.log('element found', button)
    await button.click()
    console.log('clicking element')
    await driver.switchToWebView()

    await test({
      type: 'android',
      tag: 'webview',
      wait: 1500,
      driver,
      logger,
    })
  })
})

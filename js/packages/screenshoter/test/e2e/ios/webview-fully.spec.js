const {makeDriver, test, logger} = require('../e2e')

describe('screenshoter ios app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', logger, platformVersion: '16.0'})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full webview screenshot', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Web view'})
    await button.click()
    await driver.switchToWebView()

    await test({
      type: 'ios',
      tag: 'webview-fully',
      fully: true,
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
    })
  })
})

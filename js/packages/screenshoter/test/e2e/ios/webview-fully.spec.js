const {makeDriver, test, logger, switchToWebView} = require('../e2e')

describe('screenshoter ios app', () => {
  let driver, destroyDriver

  beforeEach(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', logger})
  })

  afterEach(async () => {
    await destroyDriver()
  })

  it('take full webview screenshot', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Web view'})
    await button.click()

    await test({
      type: 'ios',
      tag: 'webview-fully',
      fully: true,
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
      webview: true,
    })
  })

  it('take full webview screenshot (when user switches to it)', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Web view'})
    await button.click()
    await switchToWebView(driver.target)

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

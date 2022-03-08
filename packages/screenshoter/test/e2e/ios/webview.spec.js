const {sleep, test} = require('../e2e')

describe.skip('screenshoter ios app', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver

  before(async () => {
    driver = await global.getDriver({type: 'ios', logger})
  })

  it('take webview screenshot', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Web view'})
    await button.click()
    await driver.target.getContexts()
    await sleep(500)
    const [, webview] = await driver.target.getContexts()
    await driver.target.switchContext(webview)
    await driver.init()

    await test({
      type: 'ios',
      tag: 'webview',
      wait: 1500,
      driver,
      logger,
    })
  })
})

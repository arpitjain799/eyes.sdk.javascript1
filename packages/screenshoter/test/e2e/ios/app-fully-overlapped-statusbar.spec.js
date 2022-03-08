const {sleep, test} = require('../e2e')

describe('screenshoter ios app', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver

  before(async () => {
    driver = await global.getDriver({type: 'ios', logger})
  })

  it('take full app screenshot with status bar on screen with overlapped status bar', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Bottom to safe area'})
    await button.click()
    await sleep(3000)

    await driver.init()

    await test({
      type: 'ios',
      tag: 'app-fully-overlapped',
      fully: true,
      withStatusBar: true,
      framed: true,
      scrollingMode: 'scroll',
      wait: 1500,
      overlap: {top: 200, bottom: 50},
      driver,
      logger,
    })
  })
})

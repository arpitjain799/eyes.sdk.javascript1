const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter ios app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full app screenshot with status bar on screen with overlapped status bar', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Bottom to safe area'})
    await button.click()
    await sleep(3000)

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

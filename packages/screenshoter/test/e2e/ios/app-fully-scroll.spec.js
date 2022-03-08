const {sleep, test} = require('../e2e')

describe('screenshoter ios app', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver

  before(async () => {
    driver = await global.getDriver({type: 'ios', logger})
  })

  it('take full app screenshot on screen with scroll view', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Scroll view'})
    await button.click()
    await sleep(3000)

    await driver.init()

    await test({
      type: 'ios',
      tag: 'app-fully-scroll',
      fully: true,
      framed: true,
      scrollingMode: 'scroll',
      wait: 1500,
      overlap: {top: 10, bottom: 50},
      driver,
      logger,
    })
  })
})

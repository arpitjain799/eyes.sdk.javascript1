const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter ios app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full element screenshot', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Scroll view with nested table'})
    await button.click()
    await sleep(3000)

    await test({
      type: 'ios',
      tag: 'element-fully',
      region: {type: 'xpath', selector: '//XCUIElementTypeTable[1]'},
      fully: true,
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
    })
  })
})

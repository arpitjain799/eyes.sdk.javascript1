const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter ios app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take viewport screenshot', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Empty table view'})
    await button.click()
    await sleep(3000)

    await test({
      type: 'ios',
      tag: 'app',
      wait: 1500,
      driver,
      logger,
    })
  })
})

const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter android app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'android', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full app screenshot on screen with recycler view', async () => {
    const button = await driver.element({type: 'id', selector: 'btn_recycler_view'})
    await button.click()
    await sleep(3000)

    await test({
      type: 'android',
      tag: 'app-fully-recycler',
      fully: true,
      framed: true,
      wait: 1500,
      scrollingMode: 'scroll',
      driver,
      logger,
    })
  })
})

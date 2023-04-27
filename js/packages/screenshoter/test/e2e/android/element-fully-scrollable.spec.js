const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter androidx app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'android', app: 'androidx', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full scrollable element screenshot', async () => {
    const button = await driver.element({type: 'id', selector: 'btn_recycler_view_in_scroll_view_activity'})
    await button.click()
    await sleep(3000)

    return test({
      type: 'android',
      tag: 'element-fully-scrollable',
      region: {type: 'id', selector: 'recyclerView'},
      fully: true,
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
    })
  })
})

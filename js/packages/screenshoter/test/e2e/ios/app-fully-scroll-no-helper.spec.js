const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter ios app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', logger, disableHelper: true})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full app screenshot on screen with scroll view without helper lib', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Scroll view'})
    await button.click()
    await sleep(3000)

    await test({
      type: 'ios',
      tag: 'app-fully-scroll-no-helper',
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

const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter androidx app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'android', app: 'androidx', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  // TODO unskip when app is fixed, at the moment it is not able to load image #10
  it.skip('take full app screenshot on screen with lazyload', async () => {
    const scrollingElement = await driver.mainContext.getScrollingElement()

    await driver.execute('mobile:scrollGesture', {
      elementId: scrollingElement.target['element-6066-11e4-a52e-4f735466cecf'],
      direction: 'down',
      percent: 10,
    })

    await sleep(3000)
    const button = await driver.element({type: 'id', selector: 'btn_large_recyclerView_activity'})
    await button.click()
    await sleep(100)

    await driver.mainContext.setScrollingElement({type: 'id', selector: 'recycler_view'})

    await test({
      type: 'android',
      tag: 'app-fully-lazyload',
      fully: true,
      framed: true,
      scrollingMode: 'scroll',
      wait: 3000,
      lazyLoad: {waitingTime: 3000},
      driver,
      logger,
    })
  })
})

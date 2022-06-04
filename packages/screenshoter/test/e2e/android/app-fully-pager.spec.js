const {makeDriver, sleep, test, logger} = require('../e2e')

describe('screenshoter androidx app', () => {
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'android', app: '/Users/kyrylo/Downloads/latest.apk', logger})
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full app screenshot on screen with pager view', async () => {
    // const button = await driver.element({type: 'id', selector: 'btn_view_pager'})
    // await button.click()
    await sleep(5000)

    await driver.init()

    await driver.mainContext.setScrollingElement({type: 'id', selector: 'view_pager_media_banner'})

    // const scrollingElement = await driver.mainContext.getScrollingElement()

    // console.log(await driver.target.getElementRect(scrollingElement.target['element-6066-11e4-a52e-4f735466cecf']))

    // await driver.target.touchAction([
    //   {action: 'press', x: 5, y: 1762},
    //   {action: 'wait', ms: 100},
    //   {action: 'moveTo', x: 5, y: 1762},
    //   {action: 'wait', ms: 170},
    //   {action: 'moveTo', x: 5, y: 358},
    //   // {action: 'wait', ms: 100},
    //   // {action: 'moveTo', x: 6, y: 358},
    //   {action: 'release'},
    // ])

    // await scrollingElement.scrollTo({x: 0, y: 624})

    // console.log('HERE!!!!!!')

    // await sleep(10000)

    await test({
      type: 'android',
      tag: 'app-fully-pager',
      fully: true,
      framed: true,
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
    })
  })
})

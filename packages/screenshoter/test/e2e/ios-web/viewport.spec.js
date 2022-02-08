const {makeDriver, test} = require('../e2e')

describe('screenshoter ios web', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', app: 'safari', logger})
    await driver.visit('https://applitools.github.io/demo/TestPages/PageWithBurgerMenu/')
  })

  after(async () => {
    await destroyDriver()
  })

  it('take viewport screenshot', async () => {
    await test({
      type: 'ios-web',
      tag: 'page',
      driver,
      logger,
    })
  })
})

const {makeDriver, test} = require('../e2e')

describe('screenshoter ios web', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver, destroyDriver

  before(async () => {
    ;[driver, destroyDriver] = await makeDriver({type: 'ios', app: 'safari', orientation: 'landscape', logger})
    await driver.visit('https://applitools.github.io/demo/TestPages/PageWithBurgerMenu/')
  })

  after(async () => {
    await destroyDriver()
  })

  it('take full page screenshot with landscape orientation', async () => {
    await test({
      type: 'ios-web',
      tag: 'page-fully-landscape',
      fully: true,
      driver,
      logger,
    })
  })
})

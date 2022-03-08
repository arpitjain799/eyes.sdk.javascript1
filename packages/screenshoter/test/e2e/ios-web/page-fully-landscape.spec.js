const {sleep, test} = require('../e2e')
const {makeLogger} = require('@applitools/logger')

describe.skip('screenshoter ios web', () => {
  const logger = makeLogger()
  let driver

  before(async () => {
    driver = await global.getDriver({type: 'ios', app: 'safari', orientation: 'landscape', logger})
  })

  it('take full page screenshot with landscape orientation', async () => {
    await driver.visit('https://applitools.github.io/demo/TestPages/PageWithBurgerMenu/')
    await sleep(5000)

    await test({
      type: 'ios-web',
      tag: 'page-fully-landscape',
      wait: 1500,
      fully: true,
      driver,
      logger,
    })
  })
})

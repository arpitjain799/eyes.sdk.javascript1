const {sleep, test} = require('../e2e')
const {makeLogger} = require('@applitools/logger')

describe('screenshoter ios web', () => {
  const logger = makeLogger()
  let driver

  before(async () => {
    driver = await global.getDriver({type: 'ios', app: 'safari', logger})
  })

  it('take viewport screenshot on page with no scale', async () => {
    await driver.visit('http://applitoolsdemo.eastus.cloudapp.azure.com/test-noscale.html')
    await sleep(5000)

    await driver.init()

    await test({
      type: 'ios-web',
      tag: 'page-noscale',
      driver,
      logger,
    })
  })
})

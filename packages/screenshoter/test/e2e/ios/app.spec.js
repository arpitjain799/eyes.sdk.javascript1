const {sleep, test} = require('../e2e')

describe('screenshoter ios app', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver

  before(async () => {
    driver = await global.getDriver({type: 'ios', logger})
  })

  it('take viewport screenshot', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Empty table view'})
    await button.click()
    await sleep(3000)

    await driver.init()

    await test({
      type: 'ios',
      tag: 'app',
      wait: 1500,
      driver,
      logger,
    })
  })
})

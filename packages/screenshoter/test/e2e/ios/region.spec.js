const {sleep, test} = require('../e2e')

describe('screenshoter ios app', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver

  before(async () => {
    driver = await global.getDriver({type: 'ios', logger})
  })

  it('take region screenshot', async () => {
    const button = await driver.element({type: 'accessibility id', selector: 'Empty table view'})
    await button.click()
    await sleep(3000)

    await driver.init()

    await test({
      type: 'ios',
      tag: 'region',
      region: {x: 30, y: 500, height: 100, width: 200},
      scrollingMode: 'scroll',
      wait: 1500,
      driver,
      logger,
    })
  })
})

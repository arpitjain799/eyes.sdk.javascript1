const {test} = require('../e2e')

describe('screenshoter ios app', () => {
  const logger = {log: () => {}, warn: () => {}, error: () => {}, verbose: () => {}}
  let driver

  before(async () => {
    driver = await global.getDriver({type: 'ios', logger})
  })

  it('take element screenshot', async () => {
    await test({
      type: 'ios',
      tag: 'element',
      region: {type: 'accessibility id', selector: 'Table view'},
      scrollingMode: 'scroll',
      driver,
      logger,
    })
  })
})

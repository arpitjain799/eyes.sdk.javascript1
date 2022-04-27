const {Builder} = require('selenium-webdriver')

describe('selenium-proxy', () => {
  it('hello world', async () => {
    const driver = await new Builder().forBrowser('chrome').usingServer('http://localhost:4444/wd/hub').build()
    console.log(driver)
    await driver.get('data:text/html,<h1>Hello, World</h1>')
    await driver.quit()
  })
})

const createSeleniumProxy = require('../src/selenium-proxy')
const {Builder} = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const chromedriver = require('chromedriver')

describe('selenium-proxy', () => {
  let egServer, egClient
  before(async () => {
    await chromedriver.start([
      '--port=4446',
      '--url-base=wd/hub',
    ], true)
    egServer = await createSeleniumProxy({
      host: 'localhost',
      port: 4445,
      forwarding_url: 'http://localhost:4446/wd/hub',
      //withQueue: true,
    })
    egClient = await createSeleniumProxy({
      host: 'localhost',
      port: 4444,
      forwarding_url: 'http://localhost:4445/wd/hub',
      //withRetry: true,
    })
  })
  after(async () => {
    egServer.close()
    egClient.close()
    chromedriver.stop()
  })
  it('works', async () => {
    async function test() {
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().headless())
        .usingServer('http://localhost:4446/wd/hub')
        .build()
      await driver.get('data:text/html,<h1>Hello, World</h1>')
      return driver.quit()
    }
    const tests = [
      test,
      test,
    ]
    await Promise.all(tests.map(test => test()))
  })
})

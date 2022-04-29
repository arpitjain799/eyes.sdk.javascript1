const createSeleniumProxy = require('../src/selenium-proxy')
const {Builder} = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const chromedriver = require('chromedriver')
const assert = require('assert')

describe('selenium-proxy', () => {
  let egServer, egClient
  before(async () => {
    await chromedriver.start(['--port=4446', '--url-base=wd/hub'], true)
    egServer = await createSeleniumProxy({
      host: 'localhost',
      port: 4445,
      forwarding_url: 'http://localhost:4446/wd/hub',
      withQueue: true,
    })
    egClient = await createSeleniumProxy({
      host: 'localhost',
      port: 4444,
      forwarding_url: 'http://localhost:4445/wd/hub',
      withRetry: true,
    })
  })
  after(async () => {
    egClient.close()
    egServer.close()
    chromedriver.stop()
  })
  it('works', async () => {
    async function test() {
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().headless())
        .usingServer('http://localhost:4444/wd/hub')
        .build()
      await driver.get('data:text/html,<h1>Hello, World</h1>')
      await driver.quit()
      return true
    }
    const tests = [test, test, test, test, test]
    const result = await Promise.all(tests.map(async (test) => await test().catch(console.error)))
    assert.deepStrictEqual(result.filter((i) => i === true).length, tests.length)
  })
})

import {describe, it, before, after} from 'mocha'
import {Eyes, VisualGridRunner} from '../src'
import assert from 'assert'
import {getTestInfo} from '@applitools/test-utils'
import {Builder} from 'selenium-webdriver'

describe('EG and Self healing', () => {
  let driver, eyes
  const serverUrl = process.env.APPLITOOLS_SERVER_URL
  const apiKey = process.env.APPLITOOLS_API_KEY

  const batch = {
    id: `${Math.random()}`,
    name: 'EG and self healing (amit)',
  }

  before(async () => {
    const executionCloudUrl = await Eyes.getExecutionCloudUrl({
      capabilities: {
        eyesServerUrl: serverUrl,
        apiKey,
        useSelfHealing: true,
      },
    })
    driver = await new Builder()
      .withCapabilities({
        browserName: 'chrome',
      })
      .usingServer(executionCloudUrl)
      .build()

    eyes = new Eyes(new VisualGridRunner({testConcurrency: 5}))
  })

  after(async () => {
    await driver.close()
  })

  it('creates sessions on execution cloud with self healing', async () => {
    const url = 'https://demo.applitools.com'
    console.log(`Accessing ${url}`)
    await driver.get(url)
    console.log('Finding the log in button')
    await driver.findElement({css: '#log-in'})
    console.log('Modifying button properties')
    await driver.executeScript("document.querySelector('#log-in').id = 'log-inn'")
    console.log('Finding button again')
    await driver.findElement({css: '#log-in'})

    console.log('Opening Eyes')
    await eyes.open(driver, {
      serverUrl,
      apiKey,
      appName: 'self healing demo',
      testName: 'ufg - self-healing',
      viewportSize: {width: 800, height: 600},
      batch,
      saveNewTests: false,
    })

    console.log('Performing check')
    await eyes.check({})

    console.log('Closing Eyes')
    const result = await eyes.close(false)

    console.log('Opening Eyes again')
    await eyes.open(driver, {
      serverUrl,
      apiKey,
      appName: 'self healing demo',
      testName: 'ufg - self-healing',
      viewportSize: {width: 800, height: 600},
      batch,
      saveNewTests: false,
    })

    console.log('Performing check')
    await eyes.check({})

    console.log('Closing Eyes')
    const result2 = await eyes.close(false)

    console.log("Asserting that first test had self healing events, and second one didn't")
    const testInfo = await getTestInfo(result, apiKey)
    testInfo.selfHealingInfo.operations.forEach((result: any) => {
      assert.deepStrictEqual(result.old, {using: 'css selector', value: '#log-in'})
      assert.deepStrictEqual(result.new, {using: 'xpath', value: '//*[@href="/app.html" ]'})
      assert(Date.parse(result.timeStamp))
    })
    const testInfo2 = await getTestInfo(result2, apiKey)
    assert.ok(!testInfo2.selfHealingInfo)
  })
})

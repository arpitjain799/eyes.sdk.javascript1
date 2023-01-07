import {describe, it, before, after} from 'mocha'
import {Eyes, VisualGridRunner, FileLogHandler} from '../src'
import assert from 'assert'
import {getTestInfo} from '@applitools/test-utils'
import {Builder} from 'selenium-webdriver'
import debug from 'debug'

const log = debug('demo')

describe('EG and Self healing', () => {
  let driver, eyes
  const serverUrl = process.env.APPLITOOLS_SERVER_URL
  const apiKey = process.env.APPLITOOLS_API_KEY

  const batch = {
    id: `${Math.random()}`,
    name: 'EG and self healing (amit)',
  }

  before(async () => {
    log('Getting Execution Cloud URL')
    const executionCloudUrl = await Eyes.getExecutionCloudUrl({
      capabilities: {
        eyesServerUrl: serverUrl,
        apiKey,
        useSelfHealing: true,
      },
    })

    log('Building driver for Execution Cloud')
    driver = await new Builder()
      .withCapabilities({
        browserName: 'chrome',
      })
      .usingServer(executionCloudUrl)
      .build()

    eyes = new Eyes(new VisualGridRunner({testConcurrency: 5}))
    eyes.setLogHandler(new FileLogHandler(true, 'demo.log', false))
  })

  after(async () => {
    await driver.close()
  })

  it('creates sessions on execution cloud with self healing', async () => {
    const url = 'https://demo.applitools.com'
    log(`Accessing ${url}`)
    await driver.get(url)
    log('Finding the log in button')
    await driver.findElement({css: '#log-in'})
    log('Modifying button properties')
    await driver.executeScript("document.querySelector('#log-in').id = 'log-inn'")
    log('Finding button again')
    await driver.findElement({css: '#log-in'})

    log('Opening Eyes')
    await eyes.open(driver, {
      serverUrl,
      apiKey,
      appName: 'self healing demo',
      testName: 'ufg - self-healing',
      viewportSize: {width: 800, height: 600},
      batch,
      saveNewTests: false,
    })

    log('Performing check')
    await eyes.check({})

    log('Closing Eyes')
    eyes.close(false).catch(log)

    log('Opening Eyes again')
    await eyes.open(driver, {
      serverUrl,
      apiKey,
      appName: 'self healing demo',
      testName: 'ufg - self-healing',
      viewportSize: {width: 800, height: 600},
      batch,
      saveNewTests: false,
    })

    log('Performing check')
    await eyes.check({})

    log('Closing Eyes')
    eyes.close(false).catch(log)

    log('Waiting for results')
    const summary = await eyes.getRunner().getAllTestResults()
    const results = summary.getAllResults().map(({testResults}) => testResults)

    log("Asserting that first test had self healing events, and second one didn't")
    const testInfo = await getTestInfo(results[0], apiKey)
    testInfo.selfHealingInfo.operations.forEach((result: any) => {
      assert.deepStrictEqual(result.old, {using: 'css selector', value: '#log-in'})
      assert.deepStrictEqual(result.new, {using: 'xpath', value: '//*[@href="/app.html" ]'})
      assert(Date.parse(result.timeStamp))
    })
    const testInfo2 = await getTestInfo(results[1], apiKey)
    assert.ok(!testInfo2.selfHealingInfo)
  })
})

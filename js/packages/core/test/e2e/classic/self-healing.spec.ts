import {makeCore} from '../../../src/classic/core'
import * as spec from '@applitools/spec-driver-selenium'
import assert from 'assert'
import {getTestInfo} from '@applitools/test-utils'
import {makeServer} from '@applitools/execution-grid-client'

describe('self-healing classic', () => {
  let driver, destroyDriver, proxy, core
  const serverUrl = 'https://testeyesapi.applitools.com' // TODO amit
  const apiKey = 'Iq33oRynu106lER36rmKN4NiftXWVzlHxWou0R3iBA7JI110' // TODO amit
  // const apiKey = '97DiFenDxLq39sj11153yEegGNF9lT0w0L92TOukKaigm0110' // TODO amit

  const batch = {
    id: `${Math.random()}`,
    name: 'EG and self healing (amit)',
  }

  before(async () => {
    proxy = await makeServer({
      eyesServerUrl: serverUrl,
      useSelfHealing: true,
    })
    ;[driver, destroyDriver] = await spec.build({
      browser: 'chrome',
      url: proxy.url,
      capabilities: {'applitools:apiKey': apiKey, 'applitools:eyesServerUrl': serverUrl},
    })
    core = makeCore<spec.Driver, spec.Driver, spec.Element, spec.Selector>({spec})

    await driver.get('https://demo.applitools.com')
    await driver.findElement({css: '#log-in'})
    await driver.executeScript("document.querySelector('#log-in').id = 'log-inn'")
    await driver.findElement({css: '#log-in'})
  })

  after(async () => {
    await destroyDriver?.()
    await proxy.server.close()
  })

  it.only('sends report on close', async () => {
    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl,
        apiKey,
        appName: 'core e2e',
        testName: 'classic - self-healing',
        environment: {viewportSize: {width: 800, height: 600}},
        batch,
      },
    })
    await eyes.check({})

    const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})

    // const eyes2 = await core.openEyes({
    //   target: driver,
    //   settings: {
    //     serverUrl,
    //     apiKey,
    //     appName: 'core e2e',
    //     testName: 'classic - self-healing',
    //     environment: {viewportSize: {width: 700, height: 460}},
    //     batch,
    //   },
    // })
    // await eyes2.check({})

    // const [result2] = await eyes2.close({settings: {updateBaselineIfNew: false}})

    const testInfo = await getTestInfo(result, apiKey)
    testInfo.selfHealingInfo.operations.forEach((result: any) => {
      assert.deepStrictEqual(result.old, '#log-in')
      assert.deepStrictEqual(result.new, '//*[@href="/app.html" ]')
      assert(Date.parse(result.timeStamp))
    })
  })

  it('sends report on abort', async () => {
    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl,
        apiKey,
        appName: 'core e2e',
        testName: 'classic - self-healing',
        environment: {viewportSize: {width: 700, height: 460}},
      },
    })
    await eyes.check({})

    const [result] = await eyes.abort()
    const testInfo = await getTestInfo(result)
    testInfo.selfHealingInfo.operations.forEach((result: any) => {
      assert.deepStrictEqual(result.old, {using: 'css selector', value: '#log-in'})
      assert.deepStrictEqual(result.new, {using: 'xpath', value: '//*[@href="/app.html" ]'})
      assert(Date.parse(result.timeStamp))
    })
  })
})

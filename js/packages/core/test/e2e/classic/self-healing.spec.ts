import {makeCore} from '../../../src/classic/core'
import {By} from 'selenium-webdriver'
import * as spec from '@applitools/spec-driver-selenium'
import assert from 'assert'
import {getTestInfo} from '@applitools/test-utils'
import {makeServer} from '@applitools/execution-grid-client'

describe.skip('self-healing classic', () => {
  let driver, destroyDriver, proxy
  const serverUrl = 'https://eyesapi.applitools.com'

  before(async () => {
    proxy = await makeServer({
      eyesServerUrl: serverUrl,
      useSelfHealing: true,
    })
    ;[driver, destroyDriver] = await spec.build({browser: 'chrome', url: proxy.url})
  })

  after(async () => {
    await destroyDriver?.()
    await proxy.server.close()
  })

  it('works', async () => {
    const core = makeCore<spec.Driver, spec.Driver, spec.Element, spec.Selector>({spec})

    await driver.get('https://demo.applitools.com')
    await driver.findElement({css: '#log-in'})
    await driver.executeScript("document.querySelector('#log-in').id = 'log-inn'")
    await driver.findElement({css: '#log-in'})

    const eyes = await core.openEyes({
      target: driver,
      settings: {
        serverUrl,
        apiKey: process.env.APPLITOOLS_API_KEY,
        appName: 'core e2e',
        testName: 'classic - self-healing',
        environment: {viewportSize: {width: 700, height: 460}},
      },
    })
    await eyes.check({})

    const result = await eyes.close({})
    const testInfo = await getTestInfo(result)
    console.log(JSON.stringify(testInfo, null, 2))
    //assert.deepStrictEqual(testInfo.actualAppOutput[0].imageMatchSettings.layout, [
    //  {
    //    left: 1,
    //    top: 519,
    //    width: 200,
    //    height: 200,
    //    regionId: '#inner',
    //  },
    //])
  })
})

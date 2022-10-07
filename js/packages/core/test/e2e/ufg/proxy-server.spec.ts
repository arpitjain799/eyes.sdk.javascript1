import {testServer, testProxyServer} from '@applitools/test-server'
import {makeCore} from '../../../src/ufg/core'
import * as spec from '@applitools/spec-driver-puppeteer'
import assert from 'assert'

describe('proxy server', () => {
  let page, destroyPage, server, baseUrl, proxyServer, proxyUrl

  before(async () => {
    proxyServer = await testProxyServer()
    proxyUrl = `http://localhost:${proxyServer.port}`
    ;[page, destroyPage] = await spec.build({
      browser: 'chrome',
      //proxy: {
      //  http: proxyUrl, 
      //  https: proxyUrl,
      //  bypass: [],
      //},
    })
    server = await testServer({showLogs: true})
    baseUrl = `http://localhost:${server.port}`
  })

  after(async () => {
    await server?.close()
    await proxyServer?.close()
    await destroyPage?.()
  })

  it('works with disableBrowserFetching enabled', async () => {
    //await page.goto(`${baseUrl}/page/index.html`)
    await page.goto('https://the-internet.herokuapp.com')

    const core = makeCore({spec, concurrency: 10})

    const eyes = await core.openEyes({
      target: page,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY,
        appName: 'some app',
        testName: 'works with disableBrowserFetching enabled',
        proxy: {
          url: proxyUrl,
        },
      },
    })

    await eyes.check({
      settings: {
        disableBrowserFetching: true,
        //autProxy: {
        //  url: proxyUrl,
        //},
      }
    })

    const [result] = await eyes.close({settings: {updateBaselineIfNew: false}})
    assert.strictEqual(result.status, 'Passed')
  })
})

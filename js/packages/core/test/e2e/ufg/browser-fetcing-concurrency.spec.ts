import {makeCore} from '../../../src/ufg/core'
import {makeTestServer} from '@applitools/test-server'
import * as spec from '@applitools/spec-driver-puppeteer'
import assert from 'assert'
import {createApp} from '../../fixtures/browser-fetching-fetchConcurrency/app'

describe('browser-fetching', () => {
  let page: spec.Driver, destroyPage: () => Promise<void>, server: any, baseUrl: string, closeApp: any
  const {startApp} = createApp({maxRequests: 2})

  before(async () => {
    ;[page, destroyPage] = await spec.build({browser: 'chrome'})
    closeApp = await startApp()
    server = await makeTestServer({
      userAgent: 'CustomUserAgent',
    })
    baseUrl = `http://localhost:${server.port}`
  })

  after(async () => {
    await server?.close()
    await closeApp()
    await destroyPage?.()
  })

  it('send fetchConcurrency to fetchResource', async () => {
    await page.goto(`${baseUrl}/browser-fetching-fetchConcurrency/index.html`)
    const core = makeCore({spec, concurrency: 10, fetchConcurrency: 2})
    const eyes = await core.openEyes({
      target: page,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY!,
        appName: 'VgFetchConcurrency',
        testName: 'FetchConcurrency',
      },
    })
    await eyes.check({settings: {renderers: [{name: 'chrome', width: 800, height: 600}], disableBrowserFetching: true}})
    await eyes.close({settings: {updateBaselineIfNew: false}})
    const [result] = await eyes.getResults()
    assert.strictEqual(result.isDifferent, false)
  })
})

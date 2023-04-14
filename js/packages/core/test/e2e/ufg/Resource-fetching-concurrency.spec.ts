import {makeCore} from '../../../src/ufg/core'
import {makeTestServer} from '@applitools/test-server'
import * as spec from '@applitools/spec-driver-puppeteer'
import assert from 'assert'
import {createApp} from '../../fixtures/browser-fetching-fetchConcurrency/app'

describe('resource fetching with fetchConcurrency', () => {
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

  it('should limit a number of resources fetched in parallel', async () => {
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

  it('should limit a number of resources fetched in parallel with two eyes instances ', async () => {
    await page.goto(`${baseUrl}/browser-fetching-fetchConcurrency/index.html`)
    const checkPromise = []
    const core = makeCore({spec, concurrency: 10, fetchConcurrency: 2})
    const eyes1 = await core.openEyes({
      target: page,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY!,
        appName: 'VgFetchConcurrency Eyes 1',
        testName: 'FetchConcurrency',
      },
    })
    const eyes2 = await core.openEyes({
      target: page,
      settings: {
        serverUrl: 'https://eyesapi.applitools.com',
        apiKey: process.env.APPLITOOLS_API_KEY!,
        appName: 'VgFetchConcurrency Eyes 2',
        testName: 'FetchConcurrency',
      },
    })
    checkPromise.push(
      eyes1.check({settings: {renderers: [{name: 'chrome', width: 800, height: 600}], disableBrowserFetching: true}}),
    )

    checkPromise.push(
      eyes2.check({settings: {renderers: [{name: 'chrome', width: 800, height: 600}], disableBrowserFetching: true}}),
    )

    await Promise.all(checkPromise)

    await eyes1.close({settings: {updateBaselineIfNew: false}})
    await eyes2.close({settings: {updateBaselineIfNew: false}})

    const [result1] = await eyes1.getResults()
    const [result2] = await eyes2.getResults()
    assert.strictEqual(result1.isDifferent, false)
    assert.strictEqual(result2.isDifferent, false)
  })
})

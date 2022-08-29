import {makeCore} from '../../../src/ufg/core'
import * as utils from '@applitools/utils'
import assert from 'assert'

describe('render concurrency', () => {
  it('runs renders with specified concurrency', async () => {
    const counters = {render: {chrome: 0, firefox: 0, safari: 0, edgechromium: 0}}

    const fakeCore = {
      getAccountInfo() {
        return {}
      },
      async openEyes() {
        return {
          async check() {
            return [{}]
          },
          async close() {
            return [{}]
          },
        }
      },
    }

    const fakeClient = {
      async createRenderTarget() {
        return {}
      },
      async bookRenderer() {
        return {rendererId: 'renderer-id'}
      },
      async render({renderRequest}) {
        await utils.general.sleep(50)
        counters.render[renderRequest.settings.renderer.name] += 1
        return {
          renderId: 'render-id',
          status: 'rendered',
          image: 'image-url',
        }
      },
    }

    const core = makeCore({concurrency: 1, core: fakeCore as any, client: fakeClient as any})

    const eyes = await core.openEyes({
      settings: {serverUrl: 'server-url', apiKey: 'api-key', appName: 'app-name', testName: 'test-name', renderConcurrency: 2},
    })

    // t1 - start one chrome and one firefox render
    await eyes.check({
      target: {cdt: []},
      settings: {
        renderers: [
          {name: 'chrome', width: 100, height: 100},
          {name: 'firefox', width: 100, height: 100},
        ],
      },
    })
    assert.deepStrictEqual(counters, {render: {chrome: 0, firefox: 0, safari: 0, edgechromium: 0}})

    // t2 - additionally start one safari and one edgechromium render
    await utils.general.sleep(10)
    await eyes.check({
      target: {cdt: []},
      settings: {
        renderers: [
          {name: 'safari', width: 100, height: 100},
          {name: 'edgechromium', width: 100, height: 100},
        ],
      },
    })

    // t3 - additionally start renders for all renderers
    await utils.general.sleep(10)
    await eyes.check({
      target: {cdt: []},
      settings: {
        renderers: [
          {name: 'chrome', width: 100, height: 100},
          {name: 'firefox', width: 100, height: 100},
          {name: 'safari', width: 100, height: 100},
          {name: 'edgechromium', width: 100, height: 100},
        ],
      },
    })
    assert.deepStrictEqual(counters, {render: {chrome: 0, firefox: 0, safari: 0, edgechromium: 0}})

    // t4 - wait for two first render to finish
    await utils.general.sleep(55)
    assert.deepStrictEqual(counters, {render: {chrome: 1, firefox: 1, safari: 0, edgechromium: 0}})

    // t4 - wait for two next render to finish
    await utils.general.sleep(55)
    assert.deepStrictEqual(counters, {render: {chrome: 1, firefox: 1, safari: 1, edgechromium: 1}})

    // t4 - wait for two next render to finish
    await utils.general.sleep(55)
    assert.deepStrictEqual(counters, {render: {chrome: 2, firefox: 2, safari: 1, edgechromium: 1}})

    // t7 - wait for two next render to finish
    await utils.general.sleep(55)
    assert.deepStrictEqual(counters, {render: {chrome: 2, firefox: 2, safari: 2, edgechromium: 2}})

    await eyes.close()
  })
})

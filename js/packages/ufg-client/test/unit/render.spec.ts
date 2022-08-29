import {makeRender} from '../../src/render'
import {type UFGRequests, type RenderRequest} from '../../src/server/requests'
import * as utils from '@applitools/utils'
import assert from 'assert'

describe('render', () => {
  function createRenderRequest(snapshotHash: string) {
    return {
      target: {
        snapshot: {hashFormat: 'sha256' as const, hash: snapshotHash, contentType: 'x-applitools-html/cdt'},
        resources: {},
      },
      settings: {type: 'web' as const, renderer: {name: 'chrome' as const, width: 1000, height: 700}},
    }
  }

  it('works', async () => {
    const render = makeRender({
      requests: {
        async startRenders({requests}) {
          return requests.map((_, index) => {
            return {renderId: `${index + 1}`} as any
          })
        },
        async checkRenderResults({renders}) {
          return renders.map(render => {
            return {renderId: render.renderId, status: 'rendered'}
          })
        },
      } as UFGRequests,
    })

    const renderResults = await Promise.all([
      render({renderRequest: createRenderRequest('page1')}),
      render({renderRequest: createRenderRequest('page2')}),
    ])
    assert.deepStrictEqual(renderResults, [
      {renderId: '1', status: 'rendered'},
      {renderId: '2', status: 'rendered'},
    ])
  })

  it('polls till rendered status is received', async () => {
    const checkRenderResultsCalls = {} as Record<string, number>
    const render = makeRender({
      requests: {
        async startRenders({requests}) {
          return requests.map((_, index) => {
            return {renderId: `${index + 1}`} as any
          })
        },
        async checkRenderResults({renders}) {
          return renders.map(render => {
            checkRenderResultsCalls[render.renderId] ??= 0
            checkRenderResultsCalls[render.renderId] += 1
            return {renderId: render.renderId, status: checkRenderResultsCalls[render.renderId] >= 3 ? 'rendered' : 'undefined'}
          })
        },
      } as UFGRequests,
    })

    const renderResults = await Promise.all([render({renderRequest: createRenderRequest('page1')})])
    assert.strictEqual(checkRenderResultsCalls['1'], 3)
    assert.deepStrictEqual(renderResults, [{renderId: '1', status: 'rendered'}])
  })

  it('throws from renders if checkRenderResults threw exception', async () => {
    const render = makeRender({
      requests: {
        async startRenders({requests}) {
          return requests.map((_, index) => {
            return {renderId: `${index + 1}`} as any
          })
        },
        async checkRenderResults({renders}) {
          return renders.map(render => {
            if (render.renderId === '2') throw new Error('fail')
            return {renderId: render.renderId, status: 'undefined'}
          })
        },
      } as UFGRequests,
      batchingTimeout: 10,
    })

    const render1Promise = render({renderRequest: createRenderRequest('page1')})
    const render2Promise = render({renderRequest: createRenderRequest('page2')})
    await assert.rejects(render1Promise, error => error.message === 'fail')
    await assert.rejects(render2Promise, error => error.message === 'fail')
  })

  it('throws in failed render if error status received', async () => {
    const render = makeRender({
      requests: {
        async startRenders({requests}) {
          return requests.map((_, index) => {
            return {renderId: `${index + 1}`} as any
          })
        },
        async checkRenderResults({renders}) {
          return renders.map(render => {
            return {renderId: render.renderId, status: render.renderId === '2' ? 'error' : 'rendered'}
          })
        },
      } as UFGRequests,
      batchingTimeout: 10,
    })

    const render1Promise = render({renderRequest: createRenderRequest('page1')})
    const render2Promise = render({renderRequest: createRenderRequest('page2')})
    await assert.doesNotReject(render1Promise)
    await assert.rejects(render2Promise, error => error.message === 'Render with id "2" failed due to an error')
  })

  it('throws if need-more-resources status is received', async () => {
    const render = makeRender({
      requests: {
        async startRenders({requests}) {
          return requests.map((_, index) => {
            return {renderId: `${index + 1}`, status: 'need-more-resources'} as any
          })
        },
      } as UFGRequests,
    })

    const renderPromise = render({renderRequest: createRenderRequest('page1')})
    await assert.rejects(renderPromise, error => error.message.startsWith('Got unexpected status'))
  })

  it('batches multiple calls in one request', async () => {
    const renderCalls = [] as RenderRequest[][]
    const render = makeRender({
      requests: {
        async startRenders({requests}) {
          renderCalls.push(requests)
          return requests.map((_, index) => {
            return {renderId: `${index + 1}`} as any
          })
        },
        async checkRenderResults({renders}) {
          return renders.map(render => {
            return {renderId: render.renderId, status: 'rendered'}
          })
        },
      } as UFGRequests,
      batchingTimeout: 10,
    })

    const renders = [] as Promise<any>[]
    renders.push(
      render({renderRequest: createRenderRequest('page1')}),
      render({renderRequest: createRenderRequest('page2')}),
      render({renderRequest: createRenderRequest('page3')}),
    )
    await utils.general.sleep(10)
    renders.push(render({renderRequest: createRenderRequest('page4')}))
    await utils.general.sleep(5)
    renders.push(render({renderRequest: createRenderRequest('page5')}))
    await utils.general.sleep(5)
    renders.push(render({renderRequest: createRenderRequest('page6')}))
    await Promise.all(renders)

    assert.strictEqual(renderCalls.length, 3)
    assert.strictEqual(renderCalls[0].length, 3)
    assert.strictEqual(renderCalls[1].length, 2)
    assert.strictEqual(renderCalls[2].length, 1)
  })
})

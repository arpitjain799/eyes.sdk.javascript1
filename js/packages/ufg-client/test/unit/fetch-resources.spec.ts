import {makeFetchResource} from '../../src/resources/fetch-resource'
import {makeResource} from '../../src/resources/resource'
import assert from 'assert'
import nock from 'nock'
import * as utils from '@applitools/utils'

describe('fetch-resource', () => {
  const mockResource = makeResource({
    url: 'http://something',
    contentType: 'some/content-type',
    value: Buffer.from('bla'),
  })
  const urlResource = makeResource({url: mockResource.url})

  it('fetches with content and content-type', async () => {
    const fetchResource = makeFetchResource({retryLimit: 0})
    nock(mockResource.url).get('/').reply(200, mockResource.value, {'content-type': mockResource.contentType})

    const resource = await fetchResource({resource: urlResource})
    assert.deepStrictEqual(resource, mockResource)
  })

  it('fetches with retries', async () => {
    let counter = 0
    nock(mockResource.url)
      .get('/')
      .times(3)
      .reply(() => {
        counter += 1
        if (counter < 3) return null
        return [200, mockResource.value, {'content-type': mockResource.contentType}]
      })

    const fetchResource = makeFetchResource({retryLimit: 3})
    const resource = await fetchResource({resource: urlResource})
    assert.deepStrictEqual(resource, mockResource)
  })

  it('fetches with retries event though fails', async () => {
    let called = 0
    const dontFetch: any = () => ((called += 1), Promise.reject(new Error('DONT FETCH')))
    const fetchResource = makeFetchResource({retryLimit: 3, fetch: dontFetch})

    await assert.rejects(fetchResource({resource: urlResource}), new Error('DONT FETCH'))
    assert.strictEqual(called, 4)
  })

  it('stops retry and returns errosStatusCode when getting bad status', async () => {
    const fetchResource = makeFetchResource({retryLimit: 3})
    let called = 0
    nock(mockResource.url)
      .get('/')
      .reply(() => {
        called += 1
        return [404, null]
      })

    const resource = await fetchResource({resource: urlResource})
    assert.deepStrictEqual(resource, makeResource({id: urlResource.id, errorStatusCode: 404}))
    assert.strictEqual(called, 1)
  })

  it('caches requests', async () => {
    const fetchResource = makeFetchResource({retryLimit: 0})
    nock(mockResource.url).get('/').once().reply(200, mockResource.value, {'content-type': mockResource.contentType})

    const [resource1, resource2] = await Promise.all([
      fetchResource({resource: urlResource}),
      fetchResource({resource: urlResource}),
    ])

    assert.deepStrictEqual(resource1, mockResource)
    assert.deepStrictEqual(resource2, mockResource)
  })

  it('fetch with concurrency limitation', async () => {
    const mockResources = []
    let count = 0,
      maxCount = 0
    for (let i = 0; i < 10; i++) {
      mockResources.push(
        makeResource({
          url: `http://something${i}`,
          contentType: 'some/content-type',
          value: Buffer.from('bla'),
        }),
      )
      nock(`http://something${i}`).get('/').reply(200, countServerParallelRequests)
    }

    const fetchResource = makeFetchResource({fetchConcurrency: 5})
    const resources = []
    for (const resource of mockResources) {
      resources.push(fetchResource({resource}))
    }

    await Promise.all(resources)

    assert.strictEqual(maxCount, 5)

    async function countServerParallelRequests() {
      count += 1
      maxCount = count > maxCount ? count : maxCount
      await utils.general.sleep(300)
      count -= 1
    }
  })

  describe('works with streamingTimeout', () => {
    const mockMediaResource = makeResource({
      url: 'http://something-media',
      contentType: 'audio/content-type',
      value: Buffer.from('bla'),
    })
    const urlMediaResource = makeResource({url: mockMediaResource.url})

    it('stop fetching media after streamingTimeout', async () => {
      nock(mockMediaResource.url)
        .get('/')
        .delayBody(200)
        .reply(200, mockMediaResource.value, {'content-type': mockMediaResource.contentType})

      const fetchResource = makeFetchResource({streamingTimeout: 80, fetchTimeout: 0})
      const resource = await fetchResource({resource: urlMediaResource})
      assert.deepStrictEqual(resource, makeResource({id: urlMediaResource.url, errorStatusCode: 599}))
    })

    it('doesnt include headers fetching time', async () => {
      nock(mockMediaResource.url)
        .get('/')
        .delay(200)
        .reply(200, mockMediaResource.value, {'content-type': mockMediaResource.contentType})

      const fetchResource = makeFetchResource({streamingTimeout: 80})
      const resource = await fetchResource({resource: urlMediaResource})
      assert.deepStrictEqual(resource, mockMediaResource)
    })

    it('doesnt apply to requests with content-length', async () => {
      nock(mockMediaResource.url).get('/').delayBody(200).reply(200, mockMediaResource.value, {
        'content-type': mockMediaResource.contentType,
        'content-length': '3',
      })

      const fetchResource = makeFetchResource({streamingTimeout: 80})
      const resource = await fetchResource({resource: urlMediaResource})
      assert.deepStrictEqual(resource, mockMediaResource)
    })

    it('doesnt apply to requests with non media content type', async () => {
      nock(mockResource.url)
        .get('/')
        .delayBody(200)
        .reply(200, mockResource.value, {'content-type': mockResource.contentType})

      const fetchResource = makeFetchResource({streamingTimeout: 80})
      const resource = await fetchResource({resource: urlResource})
      assert.deepStrictEqual(resource, mockResource)
    })
  })
})

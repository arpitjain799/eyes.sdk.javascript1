import assert from 'assert'
import nock from 'nock'
import {makeReqEyes} from '../../src/server/req-eyes'

describe('req-eyes', () => {
  const req = makeReqEyes({
    serverUrl: 'https://eyesapi.applitools.com',
    apiKey: 'api-key',
    agentId: 'agent-id',
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('handles long requests', async () => {
    const expectedRetryIntervals = [1000, 1500, 2000]
    let prevRequestTimestamp
    nock('https://eyesapi.applitools.com')
      .get('/api/sessions/long')
      .query({apiKey: 'api-key'})
      .matchHeader('eyes-expect', '202+location')
      .matchHeader('eyes-expect-version', '2')
      .matchHeader('eyes-date', () => true)
      .reply(() => {
        prevRequestTimestamp = Date.now()
        return [
          202,
          '',
          {
            'Retry-After': expectedRetryIntervals[0] / 1000,
            Location: 'https://eyesapi.applitools.com/api/sessions/poll?index=0',
          },
        ]
      })
    nock('https://eyesapi.applitools.com')
      .get('/api/sessions/poll')
      .query({apiKey: 'api-key', index: /\d+/})
      .times(3)
      .reply(url => {
        const index = Number(new URL(url, 'https://eyesapi.applitools.com').searchParams.get('index'))
        assert.ok(Date.now() - prevRequestTimestamp >= expectedRetryIntervals[index])
        prevRequestTimestamp = Date.now()
        if (index >= 2) {
          return [201, '', {Location: `https://eyesapi.applitools.com/api/sessions/result`}]
        }
        return [
          200,
          '',
          {
            'Retry-After': expectedRetryIntervals[index + 1] / 1000,
            Location: `https://eyesapi.applitools.com/api/sessions/poll?index=${index + 1}`,
          },
        ]
      })
    nock('https://eyesapi.applitools.com')
      .delete('/api/sessions/result')
      .query({apiKey: 'api-key'})
      .matchHeader('eyes-date', () => true)
      .reply(200, {hello: 'result'})

    const response = await req('./long')

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(await response.json(), {hello: 'result'})
  })

  it('starts over if getting long request result was blocked due to concurrency', async () => {
    const expectedRetryIntervals = [1000, 1500, 2000]
    let index = 0
    nock('https://eyesapi.applitools.com')
      .get('/api/sessions/long')
      .query(true)
      .times(2)
      .reply(() => {
        return [
          202,
          '',
          {'Retry-After': 0, Location: `https://eyesapi.applitools.com/api/sessions/poll?index=${index > 0 ? 3 : 0}`},
        ]
      })
    nock('https://eyesapi.applitools.com')
      .get('/api/sessions/poll')
      .query(true)
      .times(4)
      .reply(url => {
        const index = Number(new URL(url, 'https://eyesapi.applitools.com').searchParams.get('index'))
        if (index >= 2) {
          return [201, '', {Location: `https://eyesapi.applitools.com/api/sessions/result`}]
        }
        return [
          200,
          '',
          {
            'Retry-After': expectedRetryIntervals[index + 1] / 1000,
            Location: `https://eyesapi.applitools.com/api/sessions/poll?index=${index + 1}`,
          },
        ]
      })
    nock('https://eyesapi.applitools.com')
      .delete('/api/sessions/result')
      .query(true)
      .times(2)
      .reply(() => {
        return index++ > 0 ? [200, {hello: 'result'}] : [503, '']
      })

    const response = await req('./long')

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(await response.json(), {hello: 'result'})
  })
})

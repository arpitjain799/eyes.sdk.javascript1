import {makeFetchResource} from '../../src/resources/fetch-resource'
import {makeResource} from '../../src/resources/resource'
import {makeTestServer, generateCertificate} from '@applitools/test-server'
import assert from 'assert'

describe('fetch-resource', () => {
  let server: any, authority: any

  before(async () => {
    authority = await generateCertificate({days: 1})
  })

  afterEach(async () => {
    await server.close()
  })

  it('works with a self-signed certificate', async () => {
    server = await makeTestServer({...authority})
    const fetchResource = makeFetchResource({retryLimit: 0})
    const resource = await fetchResource({
      resource: makeResource({url: `https://localhost:${server.port}/page/smurfs.jpg`}),
    })
    assert.strictEqual((resource.hash as any).contentType, 'image/jpeg')
  })

  it('does not hang for unresponsive resource', async () => {
    server = await makeTestServer({
      ...authority,
      middlewares: [
        async (_req: any, _res: any, next: any) => {
          await new Promise(resolve => setTimeout(resolve, 1200))
          next()
        },
      ],
    })

    const fetchResource = makeFetchResource({retryLimit: 1, fetchTimeout: 1000})
    await assert.rejects(
      fetchResource({
        resource: makeResource({url: `https://localhost:${server.port}/page/smurfs.jpg`}),
      }),
      err => {
        assert.ok(err.message.includes('network timeout'))
        return true
      },
    )
  })
})

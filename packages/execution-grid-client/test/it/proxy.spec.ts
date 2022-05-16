import assert from 'assert'
import {createServer as createHttpServer} from 'http'
import fetch from 'node-fetch'
import {makeLogger} from '@applitools/logger'
import {makeProxy} from '../../src/proxy'

describe('proxy', () => {
  const logger = makeLogger()

  it('works with http target', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const proxyRequest = makeProxy()
      const server = createHttpServer().listen(3000, 'localhost')
      const proxyServer = createHttpServer().listen(4000, 'localhost')
      try {
        server.on('error', reject)
        proxyServer.on('error', reject)

        const headers = {original: null as any, proxied: null as any}

        server.on('request', (request, response) => {
          if (request.method === 'POST' && request.url === '/path') {
            headers.proxied = request.headers
            response.sendDate = false
            response
              .writeHead(200, {'x-header': 'value', 'Content-Type': 'application/json; charset=utf-8'})
              .end(JSON.stringify({value: true}))
          } else {
            response.writeHead(500).end()
          }
        })

        proxyServer.on('request', async (request, response) => {
          try {
            headers.original = request.headers
            await proxyRequest({request, response, options: {url: 'http://localhost:3000'}, logger})
          } catch (err) {
            reject(err)
          }
        })

        const response = await fetch('http://localhost:4000/path', {method: 'post'})

        assert.strictEqual(response.status, 200)
        assert.strictEqual(response.headers.get('x-header'), 'value')
        assert.deepStrictEqual(await response.json(), {value: true})
        assert.deepStrictEqual(headers.proxied, {...headers.original, host: 'localhost:3000'})
        resolve()
      } catch (err) {
        reject(err)
      } finally {
        server.close()
        proxyServer.close()
      }
    })
  })

  it('works with second proxy', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const proxyRequest = makeProxy()
      const server = createHttpServer().listen(3000, 'localhost')
      const secondProxyServer = createHttpServer().listen(4000, 'localhost')
      const proxyServer = createHttpServer().listen(5000, 'localhost')
      try {
        proxyServer.on('error', reject)
        secondProxyServer.on('error', reject)

        const headers = {original: null as any, proxied: null as any, doubleProxied: null as any}

        server.on('request', (request, response) => {
          if (request.method === 'POST' && request.url === '/path') {
            headers.doubleProxied = request.headers
            response.sendDate = false
            response
              .writeHead(200, {'x-header': 'value', 'Content-Type': 'application/json; charset=utf-8'})
              .end(JSON.stringify({value: true}))
          } else {
            response.writeHead(500).end()
          }
        })

        secondProxyServer.on('request', async (request, response) => {
          try {
            headers.proxied = request.headers
            await proxyRequest({request, response, logger})
          } catch (err) {
            reject(err)
          }
        })

        proxyServer.on('request', async (request, response) => {
          try {
            headers.original = request.headers
            await proxyRequest({
              request,
              response,
              options: {url: 'http://localhost:3000', proxy: 'http://localhost:4000'},
              logger,
            })
          } catch (err) {
            reject(err)
          }
        })

        const response = await fetch('http://localhost:5000/path', {method: 'post'})

        assert.strictEqual(response.status, 200)
        assert.strictEqual(response.headers.get('x-header'), 'value')
        assert.deepStrictEqual(await response.json(), {value: true})
        assert.deepStrictEqual(headers.proxied, {...headers.original, host: 'localhost:3000'})
        assert.deepStrictEqual(headers.doubleProxied, {...headers.original, host: 'localhost:3000'})
        resolve()
      } catch (err) {
        reject(err)
      } finally {
        server.close()
        proxyServer.close()
        secondProxyServer.close()
      }
    })
  })
})

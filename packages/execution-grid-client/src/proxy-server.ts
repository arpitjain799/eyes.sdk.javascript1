import './http-extension'

import {type AddressInfo} from 'net'
import {Readable} from 'stream'
import {createServer} from 'http'
import {createProxy} from 'http-proxy'
import parseBody from 'raw-body'
import * as utils from '@applitools/utils'

export type ProxyServerOptions = {
  forwardingUrl?: string
  serverUrl?: string
  apiKey?: string
}

const RETRY_BACKOFF = [].concat(
  Array(5).fill(2000), // 5 tries with delay 2s (total 10s)
  Array(4).fill(5000), // 4 tries with delay 5s (total 20s)
  10000, // all next tries with delay 10s
)

export function createProxyServer({
  forwardingUrl = 'https://exec-wus.applitools.com',
  serverUrl = process.env.APPLITOOLS_SERVER_URL,
  apiKey = process.env.APPLITOOLS_API_KEY,
}: ProxyServerOptions = {}) {
  const proxy = createProxy({
    target: forwardingUrl,
    changeOrigin: true,
    selfHandleResponse: true,
  })

  proxy.on('proxyRes', async (proxyResponse, request, response) => {
    response.writeHead(proxyResponse.statusCode, proxyResponse.headers)

    if (request.method === 'POST' && request.url === '/session') {
      const responseBody = await parseBody(proxyResponse, {encoding: 'utf-8'})
      response.body = JSON.parse(responseBody)
      if (
        response.body.value.error === 'session not created' &&
        ['CONCURRENCY_LIMIT_REACHED', 'NO_AVAILABLE_DRIVER_POD'].includes(response.body.value.data.appliErrorCode)
      ) {
        await utils.general.sleep(RETRY_BACKOFF[Math.min(request.retry, RETRY_BACKOFF.length - 1)])
        request.retry += 1
        request.removeAllListeners()
        proxy.web(request, response, {buffer: request.body && streamify(JSON.stringify(request.body))})
      } else {
        response.end(responseBody)
      }
    } else {
      proxyResponse.pipe(response)
    }
  })

  const server = createServer(async (request, response) => {
    if (request.method === 'POST' && request.url === '/session') {
      const requestBody = await parseBody(request, {encoding: 'utf-8'})
      request.body = JSON.parse(requestBody)
      const capabilities = request.body.capabilities.alwaysMatch || request.body.desiredCapabilities

      if (!utils.types.has(capabilities, 'applitools:eyesServerUrl')) {
        capabilities['applitools:eyesServerUrl'] = serverUrl
      }
      if (!utils.types.has(capabilities, 'applitools:apiKey')) {
        capabilities['applitools:apiKey'] = apiKey
      }

      request.retry = 0

      proxy.web(request, response, {buffer: streamify(JSON.stringify(request.body))})
    } else {
      proxy.web(request, response)
    }
  })

  server.listen(0, 'localhost')

  return new Promise((resolve, reject) => {
    server.on('listening', () => {
      const address = server.address() as AddressInfo
      resolve({url: `http://localhost:${address.port}`, port: address.port, server})
    })
    server.on('error', async (err: Error) => {
      reject(err)
    })
  })
}

function streamify(data: string | Buffer) {
  return new Readable({
    read() {
      this.push(data)
      this.push(null)
    },
  })
}

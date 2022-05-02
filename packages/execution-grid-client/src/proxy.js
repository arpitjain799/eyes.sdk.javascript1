const http = require('http')
const httpProxy = require('http-proxy')
const parseBody = require('raw-body')
const {Readable} = require('stream')
const utils = require('@applitools/utils')

const RETRY_BACKOFF = [].concat(
  Array(5).fill(2000), // 5 tries with delay 2s (total 10s)
  Array(4).fill(5000), // 4 tries with delay 5s (total 20s)
  10000, // all next tries with delay 10s
)

module.exports = function createProxyServer({
  forwardingUrl = 'https://exec-wus.applitools.com',
  serverUrl,
  apiKey,
} = {}) {
  const proxy = httpProxy.createProxy({
    target: forwardingUrl,
    changeOrigin: true,
    selfHandleResponse: true,
    logLevel: 'silent',
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

  const server = http.createServer(async (request, response) => {
    if (request.method === 'POST' && request.url === '/session') {
      const requestBody = await parseBody(request, {encoding: 'utf-8'})
      request.body = JSON.parse(requestBody)
      const capabilities = request.body.capabilities.alwaysMatch || request.body.desiredCapabilities

      if (!utils.types.has(capabilities, 'applitools:eyesServerUrl')) {
        capabilities['applitools:eyesServerUrl'] = serverUrl || process.env.APPLITOOLS_SERVER_URL
      }
      if (!utils.types.has(capabilities, 'applitools:apiKey')) {
        capabilities['applitools:apiKey'] = apiKey || process.env.APPLITOOLS_API_KEY
      }

      request.retry = 0

      proxy.web(request, response, {buffer: streamify(JSON.stringify(request.body))})
    } else {
      proxy.web(request, response)
    }
  })

  return new Promise((resolve, reject) => {
    server.listen(0, 'localhost', (err) => {
      if (err) return reject(err)
      const port = server.address().port
      resolve({url: `http://localhost:${port}`, port, close: () => server.close()})
    })
  })
}

function streamify(data) {
  return new Readable({
    read() {
      this.push(data)
      this.push(null)
    },
  })
}

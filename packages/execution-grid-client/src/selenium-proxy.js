const express = require('express')
const morgan = require('morgan')
const {createProxyMiddleware, responseInterceptor} = require('http-proxy-middleware')
const axios = require('axios')
const Queue = require('./queue')

function createServer({host, port, forwarding_url, withQueue, withRetry} = {}) {
  let queue
  async function q(req, res, next) {
    if (req.path === '/wd/hub/session' && req.method === 'POST') {
      console.log('[q handler]: new session request')
      if (queue.size() === 1) {
        console.log('[q handler]: limit reached, returning error')
        res.status(503).send({error: 'Concurrency limit reached'})
        next()
      } else {
        console.log('[q handler]: limit not reached, adding session')
        queue.add('session')
        console.log('[q handler]: session added')
      }
    } else if (req.path.includes('/wd/hub/session') && req.method === 'DELETE') {
      console.log('[q handler]: session ending, removing from q')
      queue.remove()
      console.log('[q handler]: session removed')
    }
    next()
  }

  async function retryOnError(buffer, proxyRes, req, res) {
    if (proxyRes.statusCode === 503 && req.method === 'POST' && req.originalUrl === '/wd/hub/session') {
      console.log('[retry handler] error on getting new session, retrying...')
      await new Promise((res) => setTimeout(res, 1000))
      const r = await axios({
        method: 'post',
        url: `http://${host}:${port}/wd/hub/session`,
        data: {
          desiredCapabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': {
              args: ['headless'],
            },
          },
        },
        //data: request.body,
      })
      res.status(200)
      return JSON.stringify(r.data)
    }
    return buffer.toString('utf8')
  }

  const app = express()
  app.use(morgan('dev'))

  if (withQueue) {
    queue = new Queue()
    app.use(q)
    app.use(
      '/wd/hub',
      createProxyMiddleware({
        target: forwarding_url,
        changeOrigin: true,
        pathRewrite: {
          [`^/wd/hub`]: '',
        },
        logLevel: 'silent',
      }),
    )
  } else if (withRetry) {
    //app.use(express.json())
    app.use(
      '/wd/hub',
      createProxyMiddleware({
        target: forwarding_url,
        changeOrigin: true,
        pathRewrite: {
          [`^/wd/hub`]: '',
        },
        logLevel: 'silent',
        selfHandleResponse: true,
        onProxyRes: responseInterceptor(retryOnError),
      }),
    )
  } else {
    app.use(
      '/wd/hub',
      createProxyMiddleware({
        target: forwarding_url,
        changeOrigin: true,
        pathRewrite: {
          [`^/wd/hub`]: '',
        },
        logLevel: 'silent',
      }),
    )
  }
  return app.listen(port, host, () => {
    console.log(`Starting Selenium proxy at ${host}:${port}`)
  })
}

if (require.main === module) {
  createServer({host: 'localhost', port: 4444, forwarding_url: 'http://localhost:4445/wd/hub'})
}

module.exports = createServer

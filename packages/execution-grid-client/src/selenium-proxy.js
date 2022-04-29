const express = require('express')
const morgan = require('morgan')
const {createProxyMiddleware, responseInterceptor} = require('http-proxy-middleware')
//const axios = require('axios')
const Queue = require('./queue')

function createServer({host, port, forwarding_url, withQueue, withRetry} = {}) {
  let queue
  async function Q(req, res, next) {
    if (req.path === '/wd/hub/session' && req.method === 'POST') {
      if (queue.size() === 1) {
        return next(res.status(503).send(new Error('blah')))
      } else {
        queue.add('session')
      }
    } else if (req.path.includes('/wd/hub/session') && req.method === 'DELETE') {
      queue.remove()
    }
    console.log('q size', queue.size())
    next()
  }

  async function retryOnError(buffer, proxyRes, req, res) {
    //if (proxyRes.statusCode === 503 && req.method === 'POST' && req.originalUrl === '/wd/hub/session') {
    //  console.log('retrying')
    //  const r = await axios.post('http://localhost:4444/wd/hub/session')
    //  console.log('HERE', r)
    //}
    console.log(`[DEBUG] original response:\n${buffer.toString('utf8')}`)
    return buffer.toString('utf8')
  }

  const app = express()
  app.use(morgan('dev'))

  if (withQueue) {
    queue = new Queue()
    app.use(Q)
    app.use('/wd/hub', createProxyMiddleware({
      target: forwarding_url,
      changeOrigin: true,
      pathRewrite: {
         [`^/wd/hub`]: '',
      },
    }))
  } else if (withRetry) {
    app.use('/wd/hub', createProxyMiddleware({
      target: forwarding_url,
      changeOrigin: true,
      pathRewrite: {
         [`^/wd/hub`]: '',
      },
      selfHandleResponse: true,
      onProxyRes: responseInterceptor(retryOnError),
    }))
  } else {
    app.use('/wd/hub', createProxyMiddleware({
      target: forwarding_url,
      changeOrigin: true,
      pathRewrite: {
         [`^/wd/hub`]: '',
      },
    }))
  }
  return app.listen(port, host, () => {
     console.log(`Starting Selenium proxy at ${host}:${port}`)
  })
}

if (require.main === module) {
  createServer({host: 'localhost', port: 4444, forwarding_url: 'http://localhost:4445/wd/hub'})
}

module.exports = createServer

const express = require('express')
const morgan = require("morgan")
const {createProxyMiddleware} = require('http-proxy-middleware')

const app = express()
const PORT = 4444
const HOST = "localhost"
const HUB_URL = "http://localhost:4445/wd/hub"
app.use(morgan('dev'))

async function q() {
  return new Promise(res => setTimeout(res, 5000))
}

app.use(async (req, res, next) => {
  if (req.path === '/wd/hub/session' && req.method === 'POST') {
    console.log('concurrency limit reached, waiting for an available session')
    const start = Date.now()
    await q()
    const end = Date.now()
    console.log(`done in ${end - start}ms`)
    next()
  } else {
    next()
  }
})

app.use('/wd/hub', createProxyMiddleware({
  target: HUB_URL,
  changeOrigin: true,
  pathRewrite: {
     [`^/wd/hub`]: '',
  },
}))

app.listen(PORT, HOST, () => {
   console.log(`Starting Selenium proxy at ${HOST}:${PORT}`)
})

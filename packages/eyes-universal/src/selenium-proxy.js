const express = require('express')
const morgan = require("morgan")
const {createProxyMiddleware} = require('http-proxy-middleware')

class Queue {
  constructor() {
    this.q = []
  }
  size() {
    return this.q.length
  }
  add(item)  {
    this.q.push(item)
  }
  remove() {
    return this.q.shift()
  }
}

const queue = new Queue()
const app = express()
const PORT = 4444
const HOST = "localhost"
const HUB_URL = "http://localhost:4445/wd/hub"
app.use(morgan('dev'))

async function q(limit = 1) {
  if (queue.size() === limit) {
    console.log('waiting for available session, polling...')
    await new Promise(res => setTimeout(res, 5000))
    return q()
  }
}

app.use(async (req, res, next) => {
  if (req.path === '/wd/hub/session' && req.method === 'POST') {
    await q()
    queue.add('session')
  } else if (req.path.includes('/wd/hub/session') && req.method === 'DELETE') {
    queue.remove()
  }
  console.log('q size', queue.size())
  next()
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

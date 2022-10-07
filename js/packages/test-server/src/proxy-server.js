const http = require('http')
const net = require('net')
const httpProxy = require('http-proxy')

function startProxyServer({port = 0} = {}) {
  const proxy = httpProxy.createServer()

  const server = http.createServer(function (req, res) {
    console.log('[proxy server] Receiving reverse proxy request for:', req.url)
    const parsedUrl = new URL(req.url)
    const prependPath = parsedUrl.hostname === 'localhost' ? false : undefined
    proxy.web(req, res, {target: req.url, prependPath})
  })

  server.on('connect', function (req, clientSocket, head) {
    console.log('[proxy server (connect event)] Receiving reverse proxy request for:', req.url)

    const serverUrl = new URL('http://' + req.url)

    const srvSocket = net.connect(serverUrl.port || 80, serverUrl.hostname, function () {
      console.log('[proxy server (connected)] Receiving reverse proxy request for:', serverUrl)
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node-Proxy\r\n' + '\r\n')
      srvSocket.write(head)
      srvSocket.pipe(clientSocket)
      clientSocket.pipe(srvSocket)
    })

    srvSocket.on('data', data => console.log('[proxy server] data found', data))

    srvSocket.on('end', () => console.log('[proxy server] end'))

    srvSocket.on('error', err => console.log('[proxy server] error', err.message))

    srvSocket.on('close', had_error => console.log('[proxy server] had error', had_error))
  })

  return new Promise(resolve => {
    server.listen(port, () => {
      const port = server.address().port
      console.log('[proxy server] listening on port', port)
      const close = server.close.bind(server)
      resolve({port, close})
    })
  })
}

module.exports = startProxyServer

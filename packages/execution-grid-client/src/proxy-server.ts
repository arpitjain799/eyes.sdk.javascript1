import {type AddressInfo} from 'net'
import {type IncomingMessage, type ServerResponse, type Server, createServer} from 'http'
import {proxy} from './proxy'
import {makeTunnelManager} from './tunnel'
import parseBody from 'raw-body'
import {type Logger, makeLogger} from '@applitools/logger'
import * as utils from '@applitools/utils'

export type ServerOptions = {
  port?: number
  forwardingUrl?: string
  tunnelUrl?: string
  serverUrl?: string
  apiKey?: string
  logger?: Logger & any
}

const RETRY_BACKOFF = [].concat(
  Array(5).fill(2000), // 5 tries with delay 2s (total 10s)
  Array(4).fill(5000), // 4 tries with delay 5s (total 20s)
  10000, // all next tries with delay 10s
)

const RETRY_ERROR_CODES = ['CONCURRENCY_LIMIT_REACHED', 'NO_AVAILABLE_DRIVER_POD']

export function makeServer({
  port = 0,
  forwardingUrl = 'https://exec-wus.applitools.com',
  tunnelUrl = process.env.APPLITOOLS_EG_TUNNEL_URL,
  serverUrl = process.env.APPLITOOLS_SERVER_URL,
  apiKey = process.env.APPLITOOLS_API_KEY,
  logger,
}: ServerOptions = {}): Promise<{url: string; port: number; server: Server}> {
  logger = logger ? logger.extend({label: 'eg-client'}) : makeLogger({label: 'eg-client', colors: true})

  const sessions = new Map()

  const {createTunnel, deleteTunnel} = makeTunnelManager({tunnelUrl, logger})

  const server = createServer(async (request, response) => {
    const requestLogger = logger.extend({
      tags: {signature: `[${request.method}]${request.url}`, requestId: utils.general.guid()},
    })

    try {
      if (request.method === 'POST' && /^\/session\/?$/.test(request.url)) {
        return await handleNewSession({request, response, logger: requestLogger})
      } else if (request.method === 'DELETE' && /^\/session\/[^\/]+\/?$/.test(request.url)) {
        return await handleStopSession({request, response, logger: requestLogger})
      } else {
        requestLogger.log('Passthrough request')
        return await proxy({request, response, options: {target: forwardingUrl}, logger: requestLogger})
      }
    } catch (err) {
      requestLogger.error(`Error during processing request:`, err)
      response
        .writeHead(500)
        .end(JSON.stringify({value: {error: 'internal proxy server error', message: err.message, stacktrace: ''}}))
    } finally {
      requestLogger.log(`Request was responded with status ${response.statusCode}`)
    }
  })

  server.listen(port, 'localhost')

  return new Promise<{url: string; port: number; server: Server}>((resolve, reject) => {
    server.on('listening', () => {
      const address = server.address() as AddressInfo
      logger.log(`Proxy server has started on port ${address.port}`)
      resolve({url: `http://localhost:${address.port}`, port: address.port, server})
    })
    server.on('error', async (err: Error) => {
      logger.fatal('Error starting proxy server', err)
      reject(err)
    })
  })

  async function handleNewSession({
    request,
    response,
    logger,
  }: {
    request: IncomingMessage
    response: ServerResponse
    logger: Logger
  }): Promise<void> {
    const requestBody = await parseBody(request, 'utf-8').then(body => (body ? JSON.parse(body) : undefined))
    if (!requestBody) return logger.log(`Request has no body`)

    logger.log(`Request was intercepted with body:`, requestBody)

    const session = {} as any
    session.serverUrl = extractCapability(requestBody, 'applitools:eyesServerUrl') ?? serverUrl
    session.apiKey = extractCapability(requestBody, 'applitools:apiKey') ?? apiKey
    session.tunnelId = extractCapability(requestBody, 'applitools:tunnel') ? await createTunnel(session) : undefined
    const timeout = extractCapability(requestBody, 'applitools:timeout') ?? process.env.APPLITOOLS_EG_TIMEOUT
    const inactivityTimeout =
      extractCapability(requestBody, 'applitools:inactivityTimeout') ?? process.env.APPLITOOLS_EG_INACTIVITY_TIMEOUT

    const applitoolsCapabilities = {
      'applitools:eyesServerUrl': session.serverUrl,
      'applitools:apiKey': session.apiKey,
      'applitools:x-tunnel-id-0': session.tunnelId,
      'applitools:timeout': timeout,
      'applitools:inactivityTimeout': inactivityTimeout,
    }

    if (requestBody.capabilities) {
      requestBody.capabilities.alwaysMatch = {...requestBody.capabilities?.alwaysMatch, ...applitoolsCapabilities}
    }
    if (requestBody.desiredCapabilities) {
      requestBody.desiredCapabilities = {...requestBody.desiredCapabilities, ...applitoolsCapabilities}
    }

    logger.log('Request body has modified:', requestBody)

    // const queue = queues.get(`${session.serverUrl}:${session.apiKey}`) ?? []
    // queue.push({request, response, requestBody})
    // if (queue.length === 1) {
    //   queues.set(`${session.serverUrl}:${session.apiKey}`, queue)
    //   return
    // }

    return proxyNewSession({session, requestBody, request, response, logger})
  }

  async function proxyNewSession({
    session,
    requestBody,
    request,
    response,
    logger,
  }: {
    session: any
    requestBody: Record<string, any>
    request: IncomingMessage
    response: ServerResponse
    logger: Logger
  }) {
    let attempt = 0
    while (true) {
      const proxyResponse = await proxy({
        request,
        response,
        options: {target: forwardingUrl, body: requestBody, handle: true},
        logger,
      })

      const responseBody =
        // @ts-ignore
        proxyResponse.body ??
        (await parseBody(proxyResponse, 'utf-8').then(body => (body ? JSON.parse(body) : undefined)))

      if (!responseBody) {
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers).end()
        return logger.log(`Response has no body`)
      }

      logger.log(`Response was intercepted with body:`, responseBody)

      if (!RETRY_ERROR_CODES.includes(responseBody.value?.data?.appliErrorCode)) {
        if (responseBody.value?.sessionId) sessions.set(responseBody.value.sessionId, session)
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers).end(JSON.stringify(responseBody))
        return
      }
      await utils.general.sleep(RETRY_BACKOFF[Math.min(attempt, RETRY_BACKOFF.length - 1)])
      attempt += 1
      request.removeAllListeners()
      logger.log(`Retrying sending the request (attempt ${attempt})`)
    }
  }

  async function handleStopSession({
    request,
    response,
    logger,
  }: {
    request: IncomingMessage
    response: ServerResponse
    logger: Logger
  }): Promise<void> {
    const sessionId = request.url.split('/').pop()
    logger.log(`Request was intercepted with sessionId:`, sessionId)

    await proxy({request, response, options: {target: forwardingUrl}, logger})

    const session = sessions.get(sessionId)
    if (session.tunnelId) {
      await deleteTunnel(session)
      logger.log(`Tunnel with id ${session.tunnelId} was deleted for session with id ${sessionId}`)
    }
    sessions.delete(sessionId)
  }

  function extractCapability(
    data: {
      desiredCapabilities?: Record<string, any>
      capabilities?: {alwaysMatch?: Record<string, any>; firstMatch?: Record<string, any>[]}
    },
    capabilityName: string,
  ): any {
    return data.capabilities?.alwaysMatch?.[capabilityName] ?? data.desiredCapabilities?.[capabilityName]
  }
}

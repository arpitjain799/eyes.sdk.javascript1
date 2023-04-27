import type {ECSession, ECCapabilitiesOptions, ECClientSettings} from '../types'
import {type IncomingMessage, type ServerResponse} from 'http'
import {type AbortSignal} from 'abort-controller'
import {type Logger} from '@applitools/logger'
import {type ReqProxy} from '../req-proxy'
import {type TunnelManager} from '../tunnels/manager'
import {makeQueue, type Queue} from '../utils/queue'
import * as utils from '@applitools/utils'

type Options = {
  settings: ECClientSettings
  req: ReqProxy
  tunnels?: TunnelManager
}

const RETRY_BACKOFF = [
  ...Array(5).fill(2000), // 5 tries with delay 2s (total 10s)
  ...Array(4).fill(5000), // 4 tries with delay 5s (total 20s)
  10000, // all next tries with delay 10s
]

export function makeStartSession({settings, req, tunnels}: Options) {
  const queues = new Map<string, Queue>()

  return async function createSession({
    request,
    response,
    logger,
  }: {
    request: IncomingMessage
    response: ServerResponse
    logger: Logger
  }): Promise<ECSession> {
    const requestBody = await utils.streams.toJSON(request)

    logger.log(`Request was intercepted with body:`, requestBody)

    const capabilities: Record<string, any> = requestBody.capabilities?.alwaysMatch ?? requestBody.desiredCapabilities
    const options = {
      ...settings.options,
      ...capabilities?.['applitools:options'],
      ...(capabilities &&
        Object.fromEntries<ECCapabilitiesOptions>(
          Object.entries(capabilities).map(([key, value]) => [key.replace(/^applitools:/, ''), value]),
        )),
    }
    const session = {
      credentials: {eyesServerUrl: options.eyesServerUrl, apiKey: options.apiKey},
      options,
    } as ECSession
    if (options.tunnel && tunnels) {
      session.tunnels = await tunnels.acquire(session.credentials)
      session.tunnels.forEach((tunnel, index) => {
        options[`x-tunnel-id-${index}`] = tunnel.tunnelId
      })
    }

    const applitoolsCapabilities = Object.fromEntries(
      Object.entries(options).map(([key, value]) => [`applitools:${key}`, value]),
    )
    if (requestBody.capabilities) {
      requestBody.capabilities.alwaysMatch = {...requestBody.capabilities?.alwaysMatch, ...applitoolsCapabilities}
    }
    if (requestBody.desiredCapabilities) {
      requestBody.desiredCapabilities = {...requestBody.desiredCapabilities, ...applitoolsCapabilities}
    }

    logger.log('Request body has modified:', requestBody)

    const queueKey = JSON.stringify(session.credentials)
    let queue = queues.get(queueKey)!
    if (!queue) {
      queue = makeQueue({logger: logger.extend({tags: {queue: queueKey}})})
      queues.set(queueKey, queue)
    }

    request.socket.on('close', () => queue.cancel(task))

    return queue.run(task)

    async function task(signal: AbortSignal, attempt = 1): Promise<ECSession | typeof queue.pause> {
      // do not start the task if it is already aborted
      if (signal.aborted) return queue.pause

      const proxyResponse = await req(request.url as string, {
        body: requestBody,
        io: {request, response, handle: false},
        // TODO uncomment when we can throw different abort reasons for task cancelation and timeout abortion
        // signal,
        logger,
      })

      const responseBody: any = await proxyResponse.json()

      logger.log(`Response was intercepted with body:`, responseBody)

      if (['CONCURRENCY_LIMIT_REACHED', 'NO_AVAILABLE_DRIVER_POD'].includes(responseBody.value?.data?.appliErrorCode)) {
        queue.cork()
        // after query is corked the task might be aborted
        if (signal.aborted) return queue.pause
        await utils.general.sleep(RETRY_BACKOFF[Math.min(attempt, RETRY_BACKOFF.length - 1)])
        logger.log(
          `Attempt (${attempt}) to create session was failed with applitools status code:`,
          responseBody.value.data.appliErrorCode,
        )
        return task(signal, attempt + 1)
      } else {
        queue.uncork()
        if (responseBody.value) {
          responseBody.value.capabilities ??= {}
          responseBody.value.capabilities['applitools:isECClient'] = true
          if (proxyResponse.headers.has('content-length')) {
            proxyResponse.headers.set('content-length', Buffer.byteLength(JSON.stringify(responseBody)).toString())
          }
          session.serverUrl = settings.serverUrl
          session.sessionId = responseBody.value.sessionId
          session.proxy = settings.proxy
          session.capabilities = responseBody.value.capabilities
        }
        response
          .writeHead(proxyResponse.status, Object.fromEntries(proxyResponse.headers.entries()))
          .end(JSON.stringify(responseBody))
        return session
      }
    }
  }
}

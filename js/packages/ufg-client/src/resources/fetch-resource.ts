import type {Cookie} from '../types'
import {type Logger} from '@applitools/logger'
import {
  makeReq,
  Request,
  Response,
  AbortController,
  type Fetch,
  type Proxy,
  type Hooks,
  type AbortSignal,
} from '@applitools/req'
import {makeResource, type UrlResource, type ContentfulResource, FailedResource} from './resource'
import {createCookieHeader} from '../utils/create-cookie-header'
import {createUserAgentHeader} from '../utils/create-user-agent-header'
import throat from 'throat'

export type FetchResourceSettings = {
  referer?: string
  proxy?: Proxy
  autProxy?: Proxy & {mode?: 'Allow' | 'Block'; domains?: string[]}
  cookies?: Cookie[]
  userAgent?: string
}

export type FetchResource = (options: {
  resource: UrlResource
  settings?: FetchResourceSettings
}) => Promise<ContentfulResource | FailedResource>

export function makeFetchResource({
  retryLimit = 5,
  streamingTimeout = 30 * 1000,
  fetchTimeout = 30 * 1000,
  fetchConcurrency,
  cache = new Map(),
  fetch,
  logger,
}: {
  retryLimit?: number
  streamingTimeout?: number
  fetchConcurrency?: number
  fetchTimeout?: number
  cache?: Map<string, Promise<ContentfulResource | FailedResource>>
  fetch?: Fetch
  logger?: Logger
} = {}): FetchResource {
  const req = makeReq({
    retry: {
      limit: retryLimit,
      validate: ({error}) => Boolean(error),
    },
    fetch,
  })
  return fetchConcurrency ? throat(fetchConcurrency, fetchResource) : fetchResource

  async function fetchResource({
    resource,
    settings = {},
  }: {
    resource: UrlResource
    settings?: FetchResourceSettings
  }): Promise<ContentfulResource | FailedResource> {
    let runningRequest = cache.get(resource.id)
    if (runningRequest) return runningRequest

    runningRequest = req(resource.url, {
      headers: {
        Referer: settings.referer,
        Cookie: settings.cookies && createCookieHeader({url: resource.url, cookies: settings.cookies}),
        'User-Agent': (resource.renderer && createUserAgentHeader({renderer: resource.renderer})) ?? settings.userAgent,
      },
      proxy: resourceUrl => {
        const {proxy, autProxy} = settings
        if (autProxy) {
          if (!autProxy.domains) return autProxy
          const domainMatch = autProxy.domains.includes(resourceUrl.hostname)
          if ((autProxy.mode === 'Allow' && domainMatch) || (autProxy.mode === 'Block' && !domainMatch)) return autProxy
        }
        return proxy
      },
      hooks: [handleLogs({logger}), handleStreaming({timeout: streamingTimeout, logger})],
      timeout: fetchTimeout,
    })
      .then(async response => {
        return response.ok
          ? makeResource({
              ...resource,
              value: Buffer.from(await response.arrayBuffer()),
              contentType: response.headers.get('Content-Type')!,
            })
          : makeResource({...resource, errorStatusCode: response.status})
      })
      .finally(() => cache.delete(resource.id))
    cache.set(resource.id, runningRequest)
    return runningRequest
  }
}

function handleLogs({logger}: {logger?: Logger}): Hooks {
  return {
    beforeRequest({request}) {
      logger?.log(
        `Resource with url ${request.url} will be fetched using headers`,
        Object.fromEntries(request.headers.entries()),
      )
    },
    beforeRetry({request, attempt}) {
      logger?.log(`Resource with url ${request.url} will be re-fetched (attempt ${attempt})`)
    },
    afterResponse({request, response}) {
      logger?.log(`Resource with url ${request.url} respond with ${response.statusText}(${response.statusText})`)
    },
    afterError({request, error}) {
      logger?.error(`Resource with url ${request.url} failed with error`, error)
    },
  }
}

function handleStreaming({timeout, logger}: {timeout: number; logger?: Logger}): Hooks {
  const controller = new AbortController()
  return {
    async beforeRequest({request}: {request: Request & {signal?: AbortSignal}}) {
      if (request.signal?.aborted) return
      request.signal?.addEventListener('abort', () => controller.abort(), {once: true})
      return new Request(request, {signal: controller.signal})
    },
    async afterResponse({response}) {
      const contentLength = response.headers.get('Content-Length')
      const contentType = response.headers.get('Content-Type')
      const isProbablyStreaming = response.ok && !contentLength && contentType && /^(audio|video)\//.test(contentType)
      if (!isProbablyStreaming) return
      return new Promise<Response>(resolve => {
        const timer = setTimeout(() => {
          controller.abort()
          resolve(new Response(undefined, {status: 599}))
          logger?.log(`Resource with url ${response.url} was interrupted, due to it takes too long to download`)
        }, timeout)
        response
          .arrayBuffer()
          .then(body => resolve(new Response(body, response)))
          .catch(() => resolve(new Response(undefined, {status: 599})))
          .finally(() => clearTimeout(timer))
      })
    },
  }
}

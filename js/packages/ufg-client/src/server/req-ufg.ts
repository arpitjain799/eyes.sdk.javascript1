import {type Logger} from '@applitools/logger'
import {makeReq, type Req, type Options, type Proxy, type Hooks} from '@applitools/req'
import * as utils from '@applitools/utils'

export type ReqUFGConfig = {
  serverUrl: string
  accessToken: string
  proxy?: Proxy
  agentId?: string
  connectionTimeout?: number
}

export type ReqUFGOptions = Options & {
  name: string
  expected?: number | number[]
  logger?: Logger
}

export type ReqUFG = Req<ReqUFGOptions>

export function makeReqUFG({config, logger}: {config: ReqUFGConfig; logger: Logger}) {
  return makeReq<ReqUFGOptions>({
    baseUrl: config.serverUrl,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Auth-Token': config.accessToken,
      'User-Agent': config.agentId,
    },
    proxy: config.proxy,
    timeout: config.connectionTimeout ?? 300000 /* 5min */,
    retry: {
      limit: 5,
      timeout: 200,
      statuses: [404, 500, 502, 504],
      codes: ['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
    },
    hooks: [handleLogs({logger}), handleUnexpectedResponse()],
  })
}

function handleLogs({logger: defaultLogger}: {logger?: Logger} = {}): Hooks<ReqUFGOptions> {
  const guid = utils.general.guid()
  let counter = 0

  return {
    beforeRequest({request, options}) {
      const logger = options?.logger ?? defaultLogger
      let requestId = request.headers.get('x-applitools-eyes-client-request-id')
      if (!requestId) {
        requestId = `${counter++}--${guid}`
        request.headers.set('x-applitools-eyes-client-request-id', requestId)
      }
      logger?.log(
        `Request "${options?.name}" [${requestId}] will be sent to the address "[${request.method}]${request.url}" with body`,
        options?.body,
      )
    },
    beforeRetry({request, attempt, error, response, options}) {
      const logger = options?.logger ?? defaultLogger
      const requestId = request.headers.get('x-applitools-eyes-client-request-id')!
      logger?.log(
        `Request "${options?.name}" [${requestId}] that was sent to the address "[${request.method}]${request.url}" with body`,
        options?.body,
        `is going to retried due to ${error ? 'an error' : 'a response with status'}`,
        error ?? `${response!.statusText}(${response!.status})`,
      )
      request.headers.set('x-applitools-eyes-client-request-id', `${requestId.split('#', 1)[0]}#${attempt + 1}`)
    },
    async afterResponse({request, response, options}) {
      const logger = options?.logger ?? defaultLogger
      const requestId = request.headers.get('x-applitools-eyes-client-request-id')
      logger?.log(
        `Request "${options?.name}" [${requestId}] that was sent to the address "[${request.method}]${request.url}" respond with ${response.statusText}(${response.status})`,
        !response.ok ? `and body ${JSON.stringify(await response.clone().text())}` : '',
      )
    },
    afterError({request, error, options}) {
      const logger = options?.logger ?? defaultLogger
      const requestId = request.headers.get('x-applitools-eyes-client-request-id')
      logger?.error(
        `Request "${options?.name}" [${requestId}] that was sent to the address "[${request.method}]${request.url}" failed with error`,
        error,
      )
    },
  }
}

function handleUnexpectedResponse(): Hooks<ReqUFGOptions> {
  return {
    async afterResponse({request, response, options}) {
      if (
        options?.expected &&
        (utils.types.isArray(options.expected)
          ? !options.expected.includes(response.status)
          : options.expected !== response.status)
      ) {
        throw new Error(
          `Request "${options?.name}" that was sent to the address "[${request.method}]${
            request.url
          }" failed due to unexpected status ${response.statusText}(${response.status}) with body ${JSON.stringify(
            await response.clone().text(),
          )}`,
        )
      }
    },
  }
}

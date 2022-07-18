import {Request} from 'node-fetch'
import globalReq, {makeReq, mergeOptions, Hooks} from './req'
import {Logger} from '@applitools/logger'
import * as utils from '@applitools/utils'

export type Options = {
  serverUrl: string
  apiKey: string
  agentId: string
  connectionTimeout?: number
  removeSession?: boolean
  logger?: Logger
}

export function makeReqEyes(options: Options): typeof globalReq {
  return makeReq({
    baseUrl: `${options.serverUrl}/api/sessions/`,
    query: {apiKey: options.apiKey, removeSession: options.removeSession},
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-applitools-eyes-client': options.agentId,
    },
    timeout: options.connectionTimeout ?? 300000 /* 5min */,
    retry: [
      // retry on network issues
      {
        limit: 5,
        timeout: 200,
        statuses: [404, 500, 502, 504],
        codes: ['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
      },
      // retry on requests that were blocked by concurrency
      {
        timeout: [].concat(Array(5).fill(2000) /* 5x2s */, Array(4).fill(5000) /* 4x5s */, 10000 /* 10s */),
        statuses: [503],
      },
    ],
    hooks: [handleLongRequests(globalReq), handleLogs(options.logger)],
  })
}

function handleLogs(logger?: Logger): Hooks {
  const guid = utils.general.guid()
  let counter = 0

  return {
    beforeRequest({request, options}) {
      let requestId = request.headers.get('x-applitools-eyes-client-request-id')
      if (!requestId) {
        requestId = `${counter++}--${guid}`
        request.headers.set('x-applitools-eyes-client-request-id', requestId)
      }

      logger?.log(
        `Request [${requestId}] will be sent to the address "${request.method} : ${request.url}" with body`,
        options.body,
      )
    },
    beforeRetry({request, attempt}) {
      const [requestId] = request.headers.get('x-applitools-eyes-client-request-id')?.split('#') ?? []
      if (requestId) {
        request.headers.set('x-applitools-eyes-client-request-id', `${requestId}#${attempt + 1}`)
      }
    },
    async afterResponse({request, response}) {
      const requestId = request.headers.get('x-applitools-eyes-client-request-id')
      logger?.log(
        `Request [${requestId}] that was sent to the address "${request.method} : ${request.url}" respond with ${response.statusText}(${response.status})`,
        !response.ok ? `and body ${JSON.stringify(await response.text())}` : '',
      )
    },
    afterError({request, error}) {
      const requestId = request.headers.get('x-applitools-eyes-client-request-id')
      logger?.error(
        `Request [${requestId}] that was sent to the address "${request.method} : ${request.url}" failed with error`,
        error,
      )
    },
  }
}

function handleLongRequests(req: typeof globalReq): Hooks {
  return {
    beforeRequest({request}) {
      request.headers.set('Eyes-Expect-Version', '2')
      request.headers.set('Eyes-Expect', '202+location')
      request.headers.set('Eyes-Date', new Date().toUTCString())
    },
    async afterResponse({request, response, options}) {
      if (response.status === 202 && response.headers.has('Location')) {
        if (response.headers.has('Retry-After')) {
          await utils.general.sleep(Number(response.headers.get('Retry-After')) * 1000)
        }

        // polling for result
        const pollResponse = await req(
          response.headers.get('Location'),
          mergeOptions(options, {
            method: 'GET',
            retry: {
              statuses: [200],
              timeout: [].concat(Array(5).fill(1000) /* 5x1s */, Array(5).fill(2000) /* 5x2s */, 5000 /* 5s */),
            },
            hooks: {
              beforeRetry({request, response}) {
                if (response.status === 200) return new Request(response.headers.get('Location'), request)
              },
            },
          }),
        )

        // getting result of the initial request
        const resultResponse = await req(
          pollResponse.headers.get('Location'),
          mergeOptions(options, {
            method: 'DELETE',
            hooks: {
              beforeRetry({response}) {
                // if the long request is blocked due to concurrency the whole long request should start over
                if (response.status === 503) return req.stop
              },
            },
          }),
        )

        return resultResponse.status === 503 ? req(request, options) : resultResponse
      }
    },
  }
}

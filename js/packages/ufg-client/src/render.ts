import {type Logger} from '@applitools/logger'
import {type UFGRequests, type RenderRequest, type StartedRender, type RenderResult} from './server/requests'
import * as utils from '@applitools/utils'

export type Render = (options: {renderRequest: RenderRequest}) => Promise<RenderResult>

export function makeRender({
  requests,
  timeout = 60 * 60 * 1000,
  batchingTimeout = 300,
  logger,
}: {
  requests: UFGRequests
  timeout?: number
  batchingTimeout?: number
  logger?: Logger
}): Render {
  const startRenderWithBatching = utils.general.batchify(startRenders, {timeout: batchingTimeout})
  const checkRenderResultWithBatching = utils.general.batchify(checkRenderResults, {timeout: batchingTimeout})

  return async function ({renderRequest}: {renderRequest: RenderRequest}) {
    const timedOutAt = Date.now() + timeout
    const render = await startRenderWithBatching(renderRequest)
    return checkRenderResultWithBatching({render, timedOutAt})
  }

  async function startRenders(batch: [RenderRequest, {resolve(result: StartedRender): void; reject(reason?: any): void}][]) {
    try {
      const renders = await requests.startRenders({requests: batch.map(([renderRequests]) => renderRequests), logger})

      renders.forEach((render, index) => {
        const [, {resolve, reject}] = batch[index]
        if (render.status === 'need-more-resources') {
          logger?.error(`Got unexpected status ${render.status} in start render response`)
          reject(new Error(`Got unexpected status ${render.status} in start render response`))
        } else {
          resolve(render)
        }
      })
    } catch (err) {
      batch.forEach(([, {reject}]) => reject(err))
    }
  }

  async function checkRenderResults(
    batch: [{render: StartedRender; timedOutAt: number}, {resolve(result: RenderResult): void; reject(reason?: any): void}][],
  ) {
    try {
      batch = batch.filter(([{render, timedOutAt}, {reject}]) => {
        if (Date.now() >= timedOutAt) {
          logger?.error(`Render with id "${render.renderId}" timed out`)
          reject(new Error(`Render with id "${render.renderId}" timed out`))
          return false
        } else {
          return true
        }
      })
      const results = await requests.checkRenderResults({renders: batch.map(([{render}]) => render), logger})
      results.forEach((result, index) => {
        const [{render, timedOutAt}, {resolve, reject}] = batch[index]
        if (result.status === 'error' || result.error) {
          logger?.error(`Render with id "${render.renderId}" failed due to an error - ${result.error}`)
          reject(new Error(`Render with id "${render.renderId}" failed due to an error - ${result.error}`))
        } else if (result.status === 'rendered') {
          resolve(result)
        } else {
          // NOTE: this may create a long promise chain
          checkRenderResultWithBatching({render, timedOutAt}).then(resolve, reject)
        }
      })
    } catch (err) {
      batch.forEach(([, {reject}]) => reject(err))
    }
  }
}

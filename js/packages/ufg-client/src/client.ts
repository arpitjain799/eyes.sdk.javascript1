import {makeLogger, type Logger} from '@applitools/logger'
import {makeUFGRequests, type UFGRequests, type UFGRequestsConfig} from './server/requests'
import {makeCreateRenderTarget, type CreateRenderTarget} from './create-render-target'
import {makeBookRenderer, type BookRenderer} from './book-renderer'
import {makeRender, type Render} from './render'
import {makeProcessResources} from './process-resources'
import {makeFetchResource} from './fetch-resource'
import {makeUploadResource} from './upload-resource'
import * as utils from '@applitools/utils'

export interface UFGClient {
  createRenderTarget: CreateRenderTarget
  bookRenderer: BookRenderer
  render: Render
  getChromeEmulationDevices: UFGRequests['getChromeEmulationDevices']
  getAndroidDevices: UFGRequests['getAndroidDevices']
  getIOSDevices: UFGRequests['getIOSDevices']
  getCachedResourceUrls(): string[]
}

export const defaultResourceCache = new Map<string, any>()

export function makeUFGClient({
  config,
  cache = defaultResourceCache,
  logger,
}: {
  config: UFGRequestsConfig
  cache?: Map<string, any>
  logger?: Logger
}): UFGClient {
  logger = logger?.extend({label: 'ufg client'}) ?? makeLogger({label: 'ufg client'})

  const requests = makeUFGRequests({config, logger})
  const fetchResource = makeFetchResource({logger})
  const uploadResource = makeUploadResource({requests, logger})
  const processResources = makeProcessResources({fetchResource, uploadResource, cache, logger})
  const bookRendererWithCache = utils.general.cachify(makeBookRenderer({requests, logger}))

  return {
    createRenderTarget: makeCreateRenderTarget({processResources}),
    bookRenderer: bookRendererWithCache,
    render: makeRender({requests, logger}),
    getChromeEmulationDevices: requests.getChromeEmulationDevices,
    getAndroidDevices: requests.getAndroidDevices,
    getIOSDevices: requests.getIOSDevices,
    getCachedResourceUrls: () => Array.from(cache.keys()),
  }
}

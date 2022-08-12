import type {AndroidDevice, ChromeEmulationDevice, IOSDevice, Region, Renderer, Selector} from '@applitools/types'
import type {Target as BaseTarget} from '@applitools/types/base'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeReqUFG, type ReqUFGConfig} from './req-ufg'
import * as utils from '@applitools/utils'

export type RenderTarget = {
  snapshot: any
  resources: any[]
  source?: string
  vhsType?: any
  vhsCompatibilityParams?: any
}

export type RenderSettings = {
  type: 'web' | 'native'
  renderer: Renderer
  rendererId?: string
  region?: Region | Selector
  fully?: boolean
  calculateRegions?: Selector[]
  includeFullPageSize?: boolean
  ufgOptions?: Record<string, any>
  hooks?: {
    beforeCaptureScreenshot: string
  }
  captureDom?: boolean
}

export type RenderRequest = {
  target: RenderTarget
  settings: RenderSettings
}

export type BookedRenderer = {
  rendererId: string
  rawEnvironment: Record<string, any>
}

export type Render = {
  renderId: string
}

export type RenderResult = BaseTarget & {
  status: 'rendered' | 'error'
  calculateRegions?: Region[][]
  error?: any
}

export type Resource = {
  value: Buffer
  contentType: string
  hash: {hashFormat: string; hash: string; contentType: string}
}

export interface UFGRequests {
  bookRenderers(options: {settings: RenderSettings[]; logger?: Logger}): Promise<BookedRenderer[]>
  startRenders(options: {requests: RenderRequest[]; logger?: Logger}): Promise<Render[]>
  checkRenderResults(options: {renders: Render[]; logger?: Logger}): Promise<RenderResult[]>
  uploadResource(options: {resource: Resource; logger?: Logger}): Promise<void>
  checkResources(options: {resources: Resource[]; logger?: Logger}): Promise<(boolean | null)[]>
  getChromeEmulationDevices(options?: {logger?: Logger}): Promise<Record<ChromeEmulationDevice, any>>
  getIOSDevices(options?: {logger?: Logger}): Promise<Record<IOSDevice, any>>
  getAndroidDevices(options?: {logger?: Logger}): Promise<Record<AndroidDevice, any>>
}

export function makeUFGRequests({
  config,
  logger: defaultLogger,
}: {
  config: ReqUFGConfig & {uploadUrl: string; stitchingServiceUrl: string}
  logger: Logger
}): UFGRequests {
  defaultLogger ??= makeLogger()
  const req = makeReqUFG({config, logger: defaultLogger})

  const getChromeEmulationDevicesWithCache = utils.general.cachify(getChromeEmulationDevices)
  const getIOSDevicesWithCache = utils.general.cachify(getIOSDevices)
  const getAndroidDevicesWithCache = utils.general.cachify(() => null)

  return {
    bookRenderers,
    startRenders,
    checkRenderResults,
    uploadResource,
    checkResources,
    getChromeEmulationDevices: getChromeEmulationDevicesWithCache,
    getIOSDevices: getIOSDevicesWithCache,
    getAndroidDevices: getAndroidDevicesWithCache,
  }

  async function bookRenderers({
    settings,
    logger = defaultLogger,
  }: {
    settings: RenderSettings[]
    logger?: Logger
  }): Promise<BookedRenderer[]> {
    logger.log('Request "bookRenderers" called for with settings', settings)
    const response = await req('./job-info', {
      name: 'bookRenderers',
      method: 'POST',
      body: settings.map(settings => ({
        agentId: config.agentId,
        options: settings.ufgOptions,
        ...extractRenderEnvironment({settings}),
      })),
      logger,
    })
    const results = await response.json().then(results => {
      return results.map(result => ({rendererId: result.renderer, rawEnvironment: result.eyesEnvironment}))
    })
    logger.log('Request "bookRenderers" finished successfully with body', results)
    return results
  }

  async function startRenders({
    requests,
    logger = defaultLogger,
  }: {
    requests: RenderRequest[]
    logger?: Logger
  }): Promise<Render[]> {
    logger.log('Request "startRenders" called for requests', requests)
    const response = await req('./render', {
      name: 'startRenders',
      method: 'POST',
      body: requests.map(({target, settings}) => {
        const renderOptions: any = {
          url: target.source,
          snapshot: target.snapshot,
          resources: target.resources,
          selectorsToFindRegionsFor: settings.calculateRegions?.map(selector => transformSelector({selector})),
          options: settings.ufgOptions,
          scriptHooks: settings.hooks,
          renderer: settings.rendererId,
          agentId: config,
          webhook: config.uploadUrl,
          stitchingService: config.stitchingServiceUrl,
          sendDom: settings.captureDom,
          includeFullPageSize: settings.includeFullPageSize,
          enableMultipleResultsPerSelector: true,
          ...extractRenderEnvironment({settings}),
        }
        if (settings.type === 'native') {
          renderOptions.renderInfo.vhsType = target.vhsType
          renderOptions.renderInfo.vhsCompatibilityParams = target.vhsCompatibilityParams
        }
        if (settings.region) {
          if (utils.types.has(settings.region, ['x', 'y', 'width', 'height'])) {
            renderOptions.target = 'region'
            renderOptions.region = settings.region
          } else {
            renderOptions.target = settings.fully ? 'full-selector' : 'selector'
            renderOptions.selector = transformSelector({selector: settings.region})
          }
        } else {
          renderOptions.target = settings.fully ? 'full-page' : 'viewport'
        }
      }),
      expected: 200,
      logger,
    })
    const results = await response.json().then(results => {
      return results.map(result => ({renderId: result.renderId}))
    })
    logger.log('Request "startRenders" finished successfully with body', results)
    return results
  }

  async function checkRenderResults({
    renders,
    logger = defaultLogger,
  }: {
    renders: Render[]
    logger?: Logger
  }): Promise<RenderResult[]> {
    logger.log('Request "checkRenderResults" called for renders', renders)
    const response = await req('./render-status', {
      name: 'checkRenderResults',
      method: 'POST',
      body: renders.map(render => render.renderId),
      expected: 200,
      timeout: 15000,
      hooks: {
        afterOptionsMerged({options}) {
          options.retry = [
            {
              limit: 3,
              timeout: 500,
              statuses: [404, 500, 502, 504],
              codes: ['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
            },
          ]
        },
      },
      logger,
    })
    const results = await response.json().then(results => {
      return results.map(result => ({
        status: result.status,
        error: result.error,
        image: result.imageLocation,
        dom: result.domLocation,
        locationInViewport: result.imagePositionInActiveFrame,
        locationInView: result.imagePositionInActiveFrame,
        fullViewSize: result.fullPageSize,
      }))
    })
    logger.log('Request "checkRenderResults" finished successfully with body', results)
    return results
  }

  async function checkResources({
    resources,
    logger = defaultLogger,
  }: {
    resources: Resource[]
    logger?: Logger
  }): Promise<(boolean | null)[]> {
    logger.log('Request "checkResources" called for resources', resources)
    const response = await req('./resources/query/resources-exist', {
      name: 'checkResources',
      method: 'POST',
      query: {
        'render-id': utils.general.guid(),
      },
      body: resources.map(resource => resource.hash),
      expected: 200,
      logger,
    })
    const results = await response.json()
    logger.log('Request "checkResources" finished successfully with body', results)
    return results
  }

  async function uploadResource({resource, logger = defaultLogger}: {resource: Resource; logger?: Logger}): Promise<void> {
    logger.log('Request "uploadResource" called for resource', resource)
    await req(`./resources/sha256/${resource.hash.hash}`, {
      name: 'uploadResource',
      method: 'PUT',
      headers: {
        'Content-Type': resource.contentType,
      },
      query: {
        'render-id': utils.general.guid(),
      },
      body: resource.value,
      expected: 200,
      logger,
    })
    logger.log('Request "uploadResource" finished successfully')
  }

  async function getChromeEmulationDevices({logger = defaultLogger}: {logger?: Logger} = {}): Promise<
    Record<ChromeEmulationDevice, any>
  > {
    logger.log('Request "getChromeEmulationDevices" called')
    const response = await req('./emulated-devices-sizes', {
      name: 'getChromeEmulationDevices',
      method: 'GET',
      logger,
    })
    const result = await response.json()
    logger.log('Request "getChromeEmulationDevices" finished successfully with body', result)
    return result
  }

  async function getIOSDevices({logger = defaultLogger}: {logger?: Logger} = {}): Promise<Record<IOSDevice, any>> {
    logger.log('Request "getIOSDevices" called')
    const response = await req('./ios-devices-sizes', {
      name: 'getIOSDevices',
      method: 'GET',
      logger,
    })
    const result = await response.json()
    logger.log('Request "getIOSDevices" finished successfully with body', result)
    return result
  }
}

function extractRenderEnvironment({settings}: {settings: RenderSettings}) {
  if (utils.types.has(settings.renderer, ['width', 'height'])) {
    return {
      platform: {name: 'linux', type: 'web'},
      browser: {name: settings.renderer.name},
      renderInfo: {width: settings.renderer.width, height: settings.renderer.height},
    }
  } else if (utils.types.has(settings.renderer, 'chromeEmulationInfo')) {
    return {
      platform: {name: 'linux', type: 'web'},
      browser: {name: 'chrome'},
      renderInfo: {emulationInfo: settings.renderer.chromeEmulationInfo},
    }
  } else if (utils.types.has(settings.renderer, 'androidDeviceInfo')) {
    return {
      platform: {name: 'android', type: settings.type ?? 'native'},
      browser: settings.type === 'web' ? {name: 'chrome'} : undefined,
      renderingInfo: {androidDeviceInfo: settings.renderer.androidDeviceInfo},
    }
  } else if (utils.types.has(settings.renderer, 'iosDeviceInfo')) {
    return {
      platform: {name: 'ios', type: settings.type ?? 'native'},
      browser: settings.type === 'web' ? {name: 'safari'} : undefined,
      renderingInfo: {iosDeviceInfo: settings.renderer.iosDeviceInfo},
    }
  }
}

function transformSelector({selector}: {selector: Selector}) {
  if (utils.types.isString(selector)) return {type: 'css', selector}
  if (!selector.frame && !selector.shadow) return selector
  const pathSelector = [] as {nodeType: string; type: string; selector: string}[]
  let currentSelector = selector as Selector | undefined
  while (currentSelector) {
    let stepSelector
    if (utils.types.isString(currentSelector)) {
      stepSelector = {nodeType: 'element', type: 'css', selector: currentSelector}
      currentSelector = undefined
    } else {
      stepSelector = {type: currentSelector.type ?? 'css', selector: currentSelector.selector}
      if (currentSelector.frame) {
        stepSelector.nodeType = 'frame'
        currentSelector = currentSelector.frame
      } else if (currentSelector.shadow) {
        stepSelector.nodeType = 'shadow-root'
        currentSelector = currentSelector.shadow
      } else {
        stepSelector.nodeType = 'element'
        currentSelector = undefined
      }
    }
    pathSelector.unshift(stepSelector)
  }
  return pathSelector
}

import type {
  Selector,
  AndroidDevice,
  IOSDevice,
  ChromeEmulationDevice,
  RenderTarget,
  RendererSettings,
  RendererEnvironment,
  RenderSettings,
  RenderResult,
} from '../types'
import {type ContentfulResource} from '../resources/resource'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeReqUFG, type ReqUFGConfig} from './req-ufg'
import * as utils from '@applitools/utils'

export type RenderRequest = {
  target: RenderTarget
  settings: RenderSettings
}

export type StartedRender = {
  jobId: string
  renderId: string
  status: string
}

export interface UFGRequests {
  bookRenderers(options: {settings: RendererSettings[]; logger?: Logger}): Promise<RendererEnvironment[]>
  startRenders(options: {requests: RenderRequest[]; logger?: Logger}): Promise<StartedRender[]>
  checkRenderResults(options: {renders: StartedRender[]; logger?: Logger}): Promise<RenderResult[]>
  uploadResource(options: {resource: ContentfulResource; logger?: Logger}): Promise<void>
  checkResources(options: {resources: ContentfulResource[]; logger?: Logger}): Promise<(boolean | null)[]>
  getChromeEmulationDevices(options?: {logger?: Logger}): Promise<Record<ChromeEmulationDevice, any>>
  getIOSDevices(options?: {logger?: Logger}): Promise<Record<IOSDevice, any>>
  getAndroidDevices(options?: {logger?: Logger}): Promise<Record<AndroidDevice, any>>
}

export type UFGRequestsConfig = ReqUFGConfig & {
  uploadUrl: string
  stitchingServiceUrl: string
}

export function makeUFGRequests({
  config,
  logger: defaultLogger,
}: {
  config: UFGRequestsConfig
  logger: Logger
}): UFGRequests {
  defaultLogger ??= makeLogger()
  const req = makeReqUFG({config, logger: defaultLogger})

  const getChromeEmulationDevicesWithCache = utils.general.cachify(getChromeEmulationDevices)
  const getIOSDevicesWithCache = utils.general.cachify(getIOSDevices)
  const getAndroidDevicesWithCache = utils.general.cachify(() => null as never)

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
    settings: RendererSettings[]
    logger?: Logger
  }): Promise<RendererEnvironment[]> {
    logger.log('Request "bookRenderers" called for with settings', settings)
    const response = await req('./job-info', {
      name: 'bookRenderers',
      method: 'POST',
      body: settings.map(settings => {
        const renderOptions: any = {
          agentId: config.agentId,
          webhook: config.uploadUrl,
          stitchingService: config.stitchingServiceUrl,
          ...extractRenderEnvironment({settings}),
        }
        renderOptions.renderInfo.target = 'viewport'
        return renderOptions
      }),
      expected: 200,
      logger,
    })
    const results = await response.json().then((results: any) => {
      return (results as any[]).map((result, index) => {
        return {
          rendererId: result.renderer,
          rendererUniqueId: utils.general.guid(),
          rendererInfo: {type: settings[index]?.type, renderer: settings[index]?.renderer},
          rawEnvironment: result.eyesEnvironment,
        } as RendererEnvironment
      })
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
  }): Promise<StartedRender[]> {
    logger.log('Request "startRenders" called for requests', requests)
    const response = await req('./render', {
      name: 'startRenders',
      method: 'POST',
      body: requests.map(({target, settings}) => {
        const renderOptions: any = {
          url: target.source,
          snapshot: target.snapshot,
          resources: target.resources,
          selectorsToFindRegionsFor: settings.selectorsToCalculate?.map(selector => transformSelector({selector})),
          options: settings.ufgOptions,
          scriptHooks: settings.hooks,
          renderer: settings.rendererId,
          agentId: config.agentId,
          webhook: config.uploadUrl,
          stitchingService: config.stitchingServiceUrl,
          sendDom: settings.sendDom,
          includeFullPageSize: settings.includeFullPageSize,
          enableMultipleResultsPerSelector: true,
          ...extractRenderEnvironment({settings}),
        }
        if (settings.type === 'native') {
          renderOptions.renderInfo.vhsType = target.vhsType
          renderOptions.renderInfo.vhsCompatibilityParams = target.vhsCompatibilityParams
          //NOTE: at the moment stitch mode is supported only for native devices
          renderOptions.renderInfo.stitchMode = settings.stitchMode
        }
        if (settings.region) {
          if (utils.types.has(settings.region, ['x', 'y', 'width', 'height'])) {
            renderOptions.renderInfo.target = 'region'
            renderOptions.renderInfo.region = settings.region
          } else {
            renderOptions.renderInfo.target = settings.fully ? 'full-selector' : 'selector'
            renderOptions.renderInfo.selector = transformSelector({selector: settings.region})
          }
        } else {
          renderOptions.renderInfo.target = settings.fully ? 'full-page' : 'viewport'
          //NOTE: at the moment scroll root is supported only for native devices
          if (settings.type === 'native') {
            renderOptions.renderInfo.selector = settings.scrollRootElement
          }
        }
        return renderOptions
      }),
      expected: 200,
      logger,
    })
    const results = await response.json().then((results: any) => {
      return (results as any[]).map(result => {
        return {jobId: result.jobId, renderId: result.renderId, status: result.renderStatus} as StartedRender
      })
    })
    logger.log('Request "startRenders" finished successfully with body', results)
    return results
  }

  async function checkRenderResults({
    renders,
    logger = defaultLogger,
  }: {
    renders: StartedRender[]
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
    const results = await response.json().then((results: any) => {
      return (results as any[]).map((result, index) => ({
        renderId: renders[index].renderId,
        status: result.status,
        error: result.error,
        image: result.imageLocation,
        dom: result.domLocation,
        locationInViewport: result.imagePositionInActiveFrame,
        locationInView: result.imagePositionInActiveFrame,
        fullViewSize: result.fullPageSize,
        selectorRegions: result.selectorRegions?.map((regions: any[]) => {
          return regions?.map(region => ({
            ...region,
            x: Math.max(0, region.x - result.imagePositionInActiveFrame.x),
            y: Math.max(0, region.y - result.imagePositionInActiveFrame.y),
          }))
        }),
      }))
    })
    logger.log('Request "checkRenderResults" finished successfully with body', results)
    return results
  }

  async function checkResources({
    resources,
    logger = defaultLogger,
  }: {
    resources: ContentfulResource[]
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
    const results: any = await response.json()
    logger.log('Request "checkResources" finished successfully with body', results)
    return results
  }

  async function uploadResource({
    resource,
    logger = defaultLogger,
  }: {
    resource: ContentfulResource
    logger?: Logger
  }): Promise<void> {
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
    const result: any = await response.json()
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
    const result: any = await response.json()
    logger.log('Request "getIOSDevices" finished successfully with body', result)
    return result
  }
}

function extractRenderEnvironment({settings}: {settings: RendererSettings}) {
  if (utils.types.has(settings.renderer, ['width', 'height'])) {
    return {
      platform: {name: 'linux', type: 'web'},
      browser: {
        name: settings.renderer.name!.replace(/(one|two)-versions?-back$/, (_, num) => (num === 'one' ? '1' : '2')),
      },
      renderInfo: {width: settings.renderer.width, height: settings.renderer.height},
    }
  } else if (utils.types.has(settings.renderer, 'chromeEmulationInfo')) {
    return {
      platform: {name: 'linux', type: 'web'},
      browser: {name: 'chrome'},
      renderInfo: {
        emulationInfo: {
          deviceName: settings.renderer.chromeEmulationInfo.deviceName,
          screenOrientation: settings.renderer.chromeEmulationInfo.screenOrientation,
        },
      },
    }
  } else if (utils.types.has(settings.renderer, 'androidDeviceInfo')) {
    return {
      platform: {name: 'android', type: settings.type ?? 'native'},
      browser: settings.type === 'web' ? {name: 'chrome'} : undefined,
      renderInfo: {
        androidDeviceInfo: {
          name: settings.renderer.androidDeviceInfo.deviceName,
          version: settings.renderer.androidDeviceInfo.version,
          screenOrientation: settings.renderer.androidDeviceInfo.screenOrientation,
        },
      },
    }
  } else if (utils.types.has(settings.renderer, 'iosDeviceInfo')) {
    return {
      platform: {name: 'ios', type: settings.type ?? 'native'},
      browser: settings.type === 'web' ? {name: 'safari'} : undefined,
      renderInfo: {
        iosDeviceInfo: {
          name: settings.renderer.iosDeviceInfo.deviceName,
          version: settings.renderer.iosDeviceInfo.version,
          screenOrientation: settings.renderer.iosDeviceInfo.screenOrientation,
        },
      },
    }
  }
}

function transformSelector({selector}: {selector: Selector}) {
  if (utils.types.isString(selector)) return {type: 'css', selector}
  if (!selector.frame && !selector.shadow) return selector
  const pathSelector = [] as {nodeType: string; type: string; selector: string}[]
  let currentSelector = selector as Selector | undefined
  while (currentSelector) {
    let stepSelector: any
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
    pathSelector.push(stepSelector)
  }
  return pathSelector
}

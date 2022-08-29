import type {Proxy, SpecDriver, Selector, Region} from '@applitools/types'
import type {Eyes as BaseEyes} from '@applitools/types/base'
import type {Target, CheckSettings, CheckResult, DomSnapshot, AndroidVHS, IOSVHS} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'
import {type UFGClient, type RenderRequest} from '@applitools/ufg-client'
import {makeDriver} from '@applitools/driver'
import {takeSnapshots} from './utils/take-snapshots'
import {waitForLazyLoad} from '../utils/wait-for-lazy-load'
import {toBaseCheckSettings} from '../utils/to-base-check-settings'
import {generateSafeSelectors} from './utils/generate-safe-selectors'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  getEyes: (options: {rawEnvironment: any}) => Promise<BaseEyes>
  client: UFGClient
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  proxy?: Proxy
  target?: Target<TDriver>
  logger?: Logger
}

export function makeCheck<TDriver, TContext, TElement, TSelector>({
  spec,
  getEyes,
  client,
  proxy,
  target: defaultTarget,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function check({
    target = defaultTarget,
    settings = {},
    logger = defaultLogger,
  }: {
    target?: Target<TDriver>
    settings?: CheckSettings<TElement, TSelector>
    logger?: Logger
  }): Promise<(CheckResult & {promise: Promise<CheckResult & {eyes: BaseEyes}>})[]> {
    logger.log('Command "check" is called with settings', settings)

    const {elementReferencesToCalculate, regionElementReference, getBaseCheckSettings} = toBaseCheckSettings({settings})

    let snapshots: DomSnapshot[] | AndroidVHS[] | IOSVHS[],
      snapshotUrl: string,
      snapshotTitle: string,
      regionSelector: {originalSelector: Selector; safeSelector: Selector},
      selectorsToCalculate: {originalSelector: Selector; safeSelector: Selector}[]
    if (spec?.isDriver(target)) {
      // TODO driver custom config
      const driver = await makeDriver({spec, driver: target, logger})
      const viewportSize = await driver.getViewportSize()
      if (driver.isWeb && (!settings.renderers || settings.renderers.length === 0)) {
        settings.renderers = [{name: 'chrome', ...viewportSize}]
      }

      const {selectors, cleanupGeneratedSelectors} = await generateSafeSelectors({
        context: driver.currentContext,
        elementReferences: regionElementReference
          ? [regionElementReference, ...elementReferencesToCalculate]
          : elementReferencesToCalculate,
      })
      if (regionElementReference) {
        ;[regionSelector, ...selectorsToCalculate] = selectors
      } else {
        selectorsToCalculate = selectors
      }

      snapshots = await takeSnapshots({
        driver,
        settings: {
          ...(settings as any), // TODO fix types
          skipResources: client.getCachedResourceUrls(),
        },
        hooks: {
          async beforeSnapshots() {
            if (driver.isWeb && settings.lazyLoad) {
              await waitForLazyLoad({driver, settings: settings.lazyLoad !== true ? settings.lazyLoad : {}, logger})
            }
          },
          async beforeEachSnapshot() {
            await utils.general.sleep(settings.waitBeforeCapture)
          },
        },
        provides: {
          getChromeEmulationDevices: client.getChromeEmulationDevices,
          getIOSDevices: client.getIOSDevices,
        },
        logger,
      })
      snapshotUrl = await driver.getUrl()
      snapshotTitle = await driver.getTitle()

      await cleanupGeneratedSelectors()
    } else {
      snapshots = !utils.types.isArray(target) ? Array(settings.renderers.length).fill(target) : target
      snapshotUrl = utils.types.has(snapshots[0], 'url') ? snapshots[0].url : undefined
      selectorsToCalculate = elementReferencesToCalculate.map(selector => ({
        originalSelector: selector as Selector,
        safeSelector: selector as Selector,
      }))
    }

    const promises = settings.renderers.map(async (renderer, index) => {
      try {
        const {cookies, ...snapshot} = snapshots[index] as typeof snapshots[number] & {cookies: any[]}
        const renderTargetPromise = client.createRenderTarget({
          snapshot,
          settings: {renderer, referer: snapshotUrl, cookies, proxy, autProxy: settings.autProxy},
        })

        const renderRequest: RenderRequest = {
          target: null,
          settings: {
            ...settings,
            region: regionSelector?.safeSelector ?? (settings.region as Region),
            type: utils.types.has(snapshot, 'cdt') ? 'web' : 'native',
            renderer,
            selectorsToCalculate: selectorsToCalculate.map(({safeSelector}) => safeSelector),
            includeFullPageSize: Boolean(settings.pageId),
          },
        }

        const {rendererId, rawEnvironment} = await client.bookRenderer({settings: renderRequest.settings})
        const eyes = await getEyes({rawEnvironment})

        try {
          renderRequest.settings.rendererId = rendererId
          renderRequest.target = await renderTargetPromise

          const {renderId, selectorRegions, ...baseTarget} = await client.render({renderRequest})
          const baseSettings = getBaseCheckSettings({
            calculatedRegions: selectorsToCalculate.map(({originalSelector}, index) => ({
              selector: originalSelector,
              regions: selectorRegions[index],
            })),
          })
          baseSettings.renderId = renderId
          baseTarget.source = snapshotUrl
          baseTarget.name = snapshotTitle

          const [result] = await eyes.check({target: baseTarget, settings: baseSettings, logger})
          return {...result, eyes, renderer}
        } catch (error) {
          error.eyes = eyes
          throw error
        }
      } catch (error) {
        error.renderer = renderer
        throw error
      }
    })

    return settings.renderers.map((renderer, index) => ({
      asExpected: true,
      windowId: null,
      renderer,
      promise: promises[index],
    }))
  }
}

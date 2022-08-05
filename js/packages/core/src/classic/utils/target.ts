import type {Location} from '@applitools/types'
import type {Target as BaseTarget, CheckSettings as BaseCheckSettings} from '@applitools/types/base'
import type {CheckSettings} from '@applitools/types/classic'
import {type Logger} from '@applitools/logger'
import {type Driver} from '@applitools/driver'
import {takeScreenshot} from '@applitools/screenshoter'
import {takeDomCapture} from './take-dom-capture'
import * as utils from '@applitools/utils'

type RegionType = 'ignore' | 'layout' | 'content' | 'strict' | 'floating' | 'accessibility'

type CodedRegion<TRegionType extends RegionType> = CheckSettings<unknown, unknown>[`${TRegionType}Regions`][number]

type BaseCodedRegion<TRegionType extends RegionType> = BaseCheckSettings[`${TRegionType}Regions`][number]

export async function makeTarget<TDriver, TContext, TElement, TSelector>({
  driver,
  settings,
  logger,
  afterScreenshot,
}: {
  driver: Driver<TDriver, TContext, TElement, TSelector>
  settings: CheckSettings<TElement, TSelector>
  logger: Logger
  afterScreenshot?: (options: any) => void | Promise<void>
}): Promise<BaseTarget> {
  const target = {} as BaseTarget
  if (settings.pageId) {
    const scrollingElement = await driver.mainContext.getScrollingElement()
    target.fullViewSize = scrollingElement ? await scrollingElement.getContentSize() : await driver.getViewportSize()
  }

  const screenshot = await takeScreenshot({
    driver,
    frames: settings?.frames.map(frame => {
      return utils.types.has(frame, 'frame')
        ? {reference: frame.frame, scrollingElement: frame.scrollRootElement}
        : {reference: frame}
    }),
    region: settings.region,
    fully: settings.fully,
    hideScrollbars: settings.hideScrollbars,
    hideCaret: settings.hideCaret,
    scrollingMode: settings.stitchMode?.toLowerCase(),
    overlap: settings.overlap,
    wait: settings.waitBeforeCapture,
    framed: driver.isNative,
    stabilization: {crop: settings.cut, scale: settings.scaleRatio, rotation: settings.rotation},
    debug: settings.debugScreenshots,
    logger,
    hooks: {
      async afterScreenshot({driver, scroller, screenshot}) {
        afterScreenshot?.({driver, screenshot})
        if (driver.isWeb && settings.sendDom) {
          if (settings.fully) await scroller.element.setAttribute('data-applitools-scroll', true)
          target.dom = await takeDomCapture({driver, logger}).catch(() => null)
        }
        if (settings.pageId) {
          const scrollingElement = await driver.mainContext.getScrollingElement()
          // In case driver.isNative the scrolling element does not use 'preserveState' and 'restoreState'.
          // as result, at this point the scrolling element will be at its scroll-most status
          const scrollingOffset = driver.isNative ? {x: 0, y: 0} : await scrollingElement.getScrollOffset()
          target.locationInView = utils.geometry.offset(scrollingOffset, screenshot.region) as Location
        }
      },
    },
  })

  target.locationInViewport = utils.geometry.location(screenshot.region)
  target.image = await screenshot.image.toPng()
  target.name = await driver.getTitle()

  return target
}

export async function makeTargetAndSettings<TDriver, TContext, TElement, TSelector>({
  driver,
  settings,
  logger,
}: {
  driver: Driver<TDriver, TContext, TElement, TSelector>
  settings: CheckSettings<TElement, TSelector>
  logger: Logger
}): Promise<{target: BaseTarget; settings: BaseCheckSettings}> {
  const result = {} as {target: BaseTarget; settings: BaseCheckSettings}

  result.target = await makeTarget({
    driver,
    settings,
    logger,
    async afterScreenshot({screenshot}) {
      result.settings = await transformCheckSettings({
        driver,
        settings,
        targetLocationInViewport: utils.geometry.location(screenshot.region),
        logger,
      })
    },
  })

  return result
}

async function transformCheckSettings<TDriver, TContext, TElement, TSelector>({
  driver,
  settings,
  targetLocationInViewport,
  logger,
}: {
  driver: Driver<TDriver, TContext, TElement, TSelector>
  settings: CheckSettings<TElement, TSelector>
  targetLocationInViewport: Location
  logger: Logger
}): Promise<BaseCheckSettings> {
  return {
    ...settings,
    ignoreRegions: await transformRegions<'ignore'>({driver, regions: settings.ignoreRegions, targetLocationInViewport, logger}),
    layoutRegions: await transformRegions<'layout'>({driver, regions: settings.layoutRegions, targetLocationInViewport, logger}),
    contentRegions: await transformRegions<'content'>({
      driver,
      regions: settings.contentRegions,
      targetLocationInViewport,
      logger,
    }),
    strictRegions: await transformRegions<'strict'>({driver, regions: settings.strictRegions, targetLocationInViewport, logger}),
    floatingRegions: await transformRegions<'floating'>({
      driver,
      regions: settings.floatingRegions,
      targetLocationInViewport,
      logger,
    }),
    accessibilityRegions: await transformRegions<'accessibility'>({
      driver,
      regions: settings.accessibilityRegions,
      targetLocationInViewport,
      logger,
    }),
  }
}

async function transformRegions<TRegionType extends RegionType>({
  driver,
  regions,
  targetLocationInViewport,
  logger: _,
}: {
  driver: Driver<unknown, unknown, unknown, unknown>
  regions: CodedRegion<TRegionType>[]
  targetLocationInViewport?: Location
  logger: Logger
}): Promise<BaseCodedRegion<TRegionType>[]> {
  const transformedRegions = [] as BaseCodedRegion<TRegionType>[]
  for (const region of regions) {
    const {region: reference, ...options} = utils.types.has(region, 'region') ? region : {region}
    if (utils.types.has(reference, ['x', 'y', 'width', 'height'])) {
      transformedRegions.push(region as BaseCodedRegion<TRegionType>)
    } else {
      const elements = await driver.currentContext.elements(reference)
      if (elements.length === 0) continue
      const contextLocationInViewport = await elements[0].context.getLocationInViewport()
      for (const element of elements) {
        const elementRegionInViewport = utils.geometry.offset(await element.getRegion(), contextLocationInViewport)
        const elementRegionInTarget = utils.geometry.offsetNegative(elementRegionInViewport, targetLocationInViewport)
        const elementRegionIScaled = utils.geometry.scale(elementRegionInTarget, driver.viewportScale)
        transformedRegions.push({
          region: elementRegionIScaled,
          regionId: utils.types.isString(element.commonSelector) ? element.commonSelector : element.commonSelector.selector,
          ...options,
        })
      }
    }
  }
  return transformedRegions
}

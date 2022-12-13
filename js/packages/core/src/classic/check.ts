import type {Eyes, Target, CheckSettings, CheckResult} from './types'
import type {Target as BaseTarget, CheckSettings as BaseCheckSettings} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {makeDriver, type Driver, type SpecDriver} from '@applitools/driver'
import {takeScreenshot} from '../automation/utils/take-screenshot'
import {takeDomCapture} from './utils/take-dom-capture'
import {toBaseCheckSettings} from '../utils/to-base-check-settings'
import {waitForLazyLoad} from '../utils/wait-for-lazy-load'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  eyes: Eyes<TDriver, TContext, TElement, TSelector>
  driver?: Driver<TDriver, TContext, TElement, TSelector>
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger?: Logger
}

export function makeCheck<TDriver, TContext, TElement, TSelector>({
  eyes,
  driver: defaultDriver,
  spec,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>): Eyes<TDriver, TContext, TElement, TSelector>['check'] {
  return async function check({
    settings = {},
    driver,
    target,
    logger = defaultLogger,
  }: {
    settings?: CheckSettings<TElement, TSelector>
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    target?: Target<TDriver>
    logger?: Logger
  } = {}): Promise<CheckResult[]> {
    logger.log('Command "check" is called with settings', settings)
    driver ??= spec?.isDriver(target) ? await makeDriver({spec, driver: target, logger}) : defaultDriver
    const baseEyes = await eyes.getBaseEyes()
    if (!driver) {
      const baseTarget = target as BaseTarget
      const baseSettings = settings as BaseCheckSettings
      return (
        await Promise.all(baseEyes.map(baseEyes => baseEyes.check({target: baseTarget, settings: baseSettings, logger})))
      ).flat()
    }
    await driver.refreshContexts()
    await driver.currentContext.setScrollingElement(settings.scrollRootElement)
    if (settings.lazyLoad && driver.isWeb) {
      await waitForLazyLoad({driver, settings: settings.lazyLoad !== true ? settings.lazyLoad : {}, logger})
    }
    // TODO it actually could be different per eyes
    const shouldRunOnce = true
    const finishAt = Date.now() + settings.retryTimeout
    let baseTarget: BaseTarget
    let baseSettings: BaseCheckSettings
    let results: CheckResult[]
    const {elementReferencesToCalculate, getBaseCheckSettings} = toBaseCheckSettings({settings})
    do {
      const screenshot = await takeScreenshot({
        driver,
        settings: {...settings, regionsToCalculate: elementReferencesToCalculate},
        logger,
      })
      baseTarget = {
        name: await driver.getTitle(),
        source: await driver.getUrl(),
        image: await screenshot.image.toPng(),
        locationInViewport: utils.geometry.location(screenshot.region),
        isTransformed: true,
      }
      baseSettings = getBaseCheckSettings({calculatedRegions: screenshot.calculatedRegions})
      if (driver.isWeb && settings.sendDom) {
        if (settings.fully) await screenshot.scrollingElement.setAttribute('data-applitools-scroll', 'true')
        else await screenshot.element?.setAttribute('data-applitools-scroll', 'true')
        baseTarget.dom = await takeDomCapture({driver, logger}).catch(() => null)
      }
      if (settings.pageId) {
        const scrollingElement = await driver.mainContext.getScrollingElement()
        const scrollingOffset = driver.isNative ? {x: 0, y: 0} : await scrollingElement.getScrollOffset()
        baseTarget.locationInView = utils.geometry.offset(scrollingOffset, screenshot.region)
        baseTarget.fullViewSize = scrollingElement ? await scrollingElement.getContentSize() : await driver.getViewportSize()
      }
      await screenshot.restoreState()
      baseSettings.ignoreMismatch = !shouldRunOnce
      results = (
        await Promise.all(baseEyes.map(baseEyes => baseEyes.check({target: baseTarget, settings: baseSettings, logger})))
      ).flat()
    } while (!shouldRunOnce && !results.some(result => result.asExpected) && Date.now() < finishAt)
    if (!shouldRunOnce && !results.some(result => result.asExpected)) {
      baseSettings.ignoreMismatch = false
      results = (
        await Promise.all(baseEyes.map(baseEyes => baseEyes.check({target: baseTarget, settings: baseSettings, logger})))
      ).flat()
    }
    return results
  }
}

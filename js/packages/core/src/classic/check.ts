import type {MaybeArray, SpecDriver} from '@applitools/types'
import type {Eyes as BaseEyes, Target as BaseTarget, CheckSettings as BaseCheckSettings} from '@applitools/types/base'
import type {Target, CheckSettings, CheckResult} from '@applitools/types/classic'
import {type Logger} from '@applitools/logger'
import {makeDriver} from '@applitools/driver'
import {takeScreenshot} from './utils/take-screenshot'
import {takeDomCapture} from './utils/take-dom-capture'
import {transformCheckSettings} from './utils/transform-check-settings'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  eyes: BaseEyes
  target: Target<TDriver>
  logger: Logger
}

export function makeCheck<TDriver, TContext, TElement, TSelector>({
  spec,
  eyes,
  target: defaultTarget,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function ({
    target = defaultTarget,
    settings,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver>
    settings?: MaybeArray<CheckSettings<TElement, TSelector>>
    logger?: Logger
  } = {}): Promise<CheckResult[]> {
    logger.log('Command "check" is called with settings', settings)
    if (!spec.isDriver(target)) {
      return eyes.check({target, settings: settings as MaybeArray<BaseCheckSettings>, logger})
    }
    settings = utils.types.isArray(settings) ? settings : [settings]
    // TODO driver custom config
    const driver = await makeDriver({spec, driver: target, logger})
    const results = await settings.reduce(async (prev, settings) => {
      const steps = await prev
      const finishAt = Date.now() + settings.timeout /* maxDuration */
      let baseTarget: BaseTarget
      let baseSettings: BaseCheckSettings
      let results: CheckResult[]
      do {
        const screenshot = await takeScreenshot({driver, settings, logger})
        baseTarget = {
          name: await driver.getTitle(),
          source: await driver.getUrl(),
          image: await screenshot.image.toPng(),
          locationInViewport: utils.geometry.location(screenshot.region),
        }
        if (driver.isWeb && settings.sendDom) {
          if (settings.fully) await screenshot.scrollingElement.setAttribute('data-applitools-scroll', 'true')
          baseTarget.dom = await takeDomCapture({driver, logger}).catch(() => null)
        }
        if (settings.pageId) {
          const scrollingElement = await driver.mainContext.getScrollingElement()
          const scrollingOffset = driver.isNative ? {x: 0, y: 0} : await scrollingElement.getScrollOffset()
          baseTarget.locationInView = utils.geometry.offset(scrollingOffset, screenshot.region)
          baseTarget.fullViewSize = scrollingElement ? await scrollingElement.getContentSize() : await driver.getViewportSize()
        }
        baseSettings = await transformCheckSettings({driver, screenshot, settings, logger})
        await screenshot.restoreState()
        results = await eyes.check({target: baseTarget, settings: {...baseSettings, ignoreMismatch: true}, logger})
      } while (!results.some(result => result.asExpected) && Date.now() < finishAt)
      if (!results.some(result => result.asExpected)) {
        results = await eyes.check({target: baseTarget, settings: baseSettings, logger})
      }
      steps.push(results)
      return steps
    }, Promise.resolve([] as CheckResult[][]))
    return results.flat()
  }
}

import type {Eyes, Target, LocateTextSettings, LocateTextResult} from './types'
import type {Target as BaseTarget, LocateTextSettings as BaseLocateTextSettings} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {makeDriver, type Driver, type SpecDriver} from '@applitools/driver'
import {takeScreenshot} from '../automation/utils/take-screenshot'
// import {takeDomCapture} from './utils/take-dom-capture'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  eyes: Eyes<TDriver, TContext, TElement, TSelector>
  driver?: Driver<TDriver, TContext, TElement, TSelector>
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger?: Logger
}

export function makeLocateText<TDriver, TContext, TElement, TSelector>({
  spec,
  driver: defaultDriver,
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>): Eyes<TDriver, TContext, TElement, TSelector>['locateText'] {
  return async function locateText<TPattern extends string>({
    settings,
    driver,
    target,
    logger = defaultLogger,
  }: {
    settings?: LocateTextSettings<TPattern, TElement, TSelector>
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    target?: Target<TDriver>
    logger?: Logger
  } = {}): Promise<LocateTextResult<TPattern>> {
    logger.log('Command "locateText" is called with settings', settings)
    driver ??= spec?.isDriver(target) ? await makeDriver({spec, driver: target, logger}) : defaultDriver
    const [baseEyes] = await eyes.getBaseEyes()
    if (!driver) {
      return baseEyes.locateText({target: target as BaseTarget, settings: settings as BaseLocateTextSettings<TPattern>, logger})
    }
    const screenshot = await takeScreenshot({driver, settings, logger})
    const baseTarget = {
      image: await screenshot.image.toPng(),
      locationInViewport: utils.geometry.location(screenshot.region),
    }
    if (driver.isWeb) {
      // if (settings.fully) await screenshot.scrollingElement.setAttribute('data-applitools-scroll', 'true')
      // else await screenshot.element?.setAttribute('data-applitools-scroll', 'true')
      // baseTarget.dom = await takeDomCapture({driver, logger}).catch(() => null)
    }
    const results = await baseEyes.locateText({
      target: baseTarget,
      settings: settings as BaseLocateTextSettings<TPattern>,
      logger,
    })
    return results
  }
}

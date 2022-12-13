import type {Core, Target, Screenshot, LocateSettings, LocateResult} from './types'
import type {Core as BaseCore, LocateSettings as BaseLocateSettings} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {makeDriver, type Driver, type SpecDriver} from '@applitools/driver'
import {takeScreenshot} from './utils/take-screenshot'

type Options<TDriver, TContext, TElement, TSelector> = {
  core: BaseCore
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  target?: Target<TDriver>
  logger?: Logger
}

export function makeLocate<TDriver, TContext, TElement, TSelector>({
  spec,
  core,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>): Core<TDriver, TContext, TElement, TSelector>['locate'] {
  return async function locate<TLocator extends string>({
    settings,
    driver,
    target,
    logger = defaultLogger,
  }: {
    settings?: LocateSettings<TLocator, TElement, TSelector>
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    target?: Target<TDriver> | Screenshot
    logger?: Logger
  } = {}): Promise<LocateResult<TLocator>> {
    logger.log(`Command "locate" is called with ${driver ? 'driver' : 'target'} and settings`, settings)
    driver ??= spec?.isDriver(target) ? await makeDriver({spec, driver: target, logger}) : null
    if (!driver) {
      return core.locate({target: target as Screenshot, settings: settings as BaseLocateSettings<TLocator>, logger})
    }
    const screenshot = await takeScreenshot({driver, settings, logger})
    const baseTarget = {image: await screenshot.image.toPng()}
    const results = await core.locate({target: baseTarget, settings: settings as BaseLocateSettings<TLocator>, logger})
    return results
  }
}

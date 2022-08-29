import type {SpecDriver, Region} from '@applitools/types'
import type {Eyes as BaseEyes} from '@applitools/types/base'
import type {Target, LocateSettings} from '@applitools/types/classic'
import {type Logger} from '@applitools/logger'
import {makeDriver} from '@applitools/driver'
import {takeScreenshot} from './utils/take-screenshot'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  eyes: BaseEyes
  target: Target<TDriver>
  logger: Logger
}

export function makeLocate<TDriver, TContext, TElement, TSelector>({
  spec,
  eyes,
  target: defaultTarget,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function locate<TLocator extends string>({
    target = defaultTarget,
    settings,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver>
    settings?: LocateSettings<TLocator, TElement, TSelector>
    logger?: Logger
  } = {}): Promise<Record<TLocator, Region[]>> {
    logger.log('Command "check" is called with settings', settings)
    if (!spec.isDriver(target)) {
      return eyes.locate({target, settings, logger})
    }
    // TODO driver custom config
    const driver = await makeDriver({spec, driver: target, logger})
    const screenshot = await takeScreenshot({driver, settings, logger})
    const baseTarget = {
      image: await screenshot.image.toPng(),
    }
    const results = await eyes.locate({target: baseTarget, settings, logger})
    return results
  }
}

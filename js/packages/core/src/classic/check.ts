import type {MaybeArray, SpecDriver} from '@applitools/types'
import type {Eyes as BaseEyes, CheckSettings as BaseCheckSettings} from '@applitools/types/base'
import type {Target, CheckSettings, CheckResult} from '@applitools/types/classic'
import {type Logger} from '@applitools/logger'
import {Driver} from '@applitools/driver'
import {makeTargetAndSettings} from './utils/target'
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
    if (!spec.isDriver(target)) return eyes.check({target, settings: settings as MaybeArray<BaseCheckSettings>})

    // TODO driver custom config

    const driver = await new Driver({spec, driver: target, logger}).init()
    await driver.refreshContexts() // TODO put in init
    settings = utils.types.isArray(settings) ? settings : [settings]

    return settings.reduce((results, settings) => {
      return results.then(async results => {
        const input = await makeTargetAndSettings({driver, settings, logger})
        return results.concat(await eyes.check({...input, logger}))
      })
    }, Promise.resolve([] as CheckResult[]))
  }
}

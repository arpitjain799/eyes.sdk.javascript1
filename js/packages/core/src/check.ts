import type {Eyes, Target, Config, CheckSettings, CheckResult} from '@applitools/types'
import {type Logger} from '@applitools/logger'

type Options<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TDriver, TElement, TSelector, TType>
  logger: Logger
}

export function makeCheck<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'>({
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TElement, TSelector, TType>) {
  return async function check({
    target,
    settings = {},
    config,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver, TType>
    settings?: CheckSettings<TElement, TSelector, TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  } = {}): Promise<CheckResult<TType>[]> {
    settings = {...config?.screenshot, ...config?.check, ...settings}
    const results = await eyes.check({target, settings, logger})
    return results
  }
}

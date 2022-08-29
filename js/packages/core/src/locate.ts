import type {Region, Eyes, Target, Config, LocateSettings} from '@applitools/types'
import {type Logger} from '@applitools/logger'

type Options<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TDriver, TElement, TSelector, TType>
  logger: Logger
}

export function makeLocate<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg' = 'classic'>({
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TElement, TSelector, TType>) {
  return async function locate<TLocator extends string>({
    target,
    settings,
    config,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver, TType>
    settings: LocateSettings<TLocator, TElement, TSelector, TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<Record<TLocator, Region[]>> {
    settings = {...config?.screenshot, ...settings}
    const results = await eyes.locate({target, settings, logger})
    return results
  }
}

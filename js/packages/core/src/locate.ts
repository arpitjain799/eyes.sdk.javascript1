import type {Region, Target, Config, LocateSettings} from '@applitools/types'
import type {Eyes as ClassicEyes} from '@applitools/types/classic'
import type {Eyes as UFGEyes} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'

type Options<TDriver, TElement, TSelector> = {
  eyes: ClassicEyes<TDriver, TElement, TSelector> | UFGEyes<TDriver, TElement, TSelector>
  logger: Logger
}

export function makeLocate<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'>({
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TElement, TSelector>) {
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
    settings.appName ??= config?.open?.appName

    const results = await eyes.locate({target: target as any, settings, logger})
    return results
  }
}

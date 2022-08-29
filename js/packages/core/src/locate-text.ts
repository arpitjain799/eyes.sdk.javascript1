import type {TextRegion, Eyes, Target, Config, LocateTextSettings} from '@applitools/types'
import {type Logger} from '@applitools/logger'

type Options<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TDriver, TElement, TSelector, TType>
  logger: Logger
}

export function makeLocateText<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg' = 'classic' | 'ufg'>({
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TElement, TSelector, TType>) {
  return async function locateText<TPattern extends string>({
    target,
    settings,
    config,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver, TType>
    settings: LocateTextSettings<TPattern, TElement, TSelector, TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<Record<TPattern, TextRegion[]>> {
    settings = {...config?.screenshot, ...settings}
    const results = await eyes.locateText({target: target as any, settings, logger})
    return results
  }
}

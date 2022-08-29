import type {MaybeArray, Eyes, Target, Config, ExtractTextSettings} from '@applitools/types'
import {type Logger} from '@applitools/logger'

type Options<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TDriver, TElement, TSelector, TType>
  logger: Logger
}

export function makeExtractText<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg' = 'classic' | 'ufg'>({
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TElement, TSelector, TType>) {
  return async function extractText({
    target,
    settings,
    config,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver, TType>
    settings: MaybeArray<ExtractTextSettings<TElement, TSelector, TType>>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<string[]> {
    settings = {...config?.screenshot, ...settings}
    const results = await eyes.extractText({target: target as any, settings, logger})
    return results
  }
}

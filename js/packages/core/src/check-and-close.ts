import type {Eyes, Target, Config, CheckSettings, CloseSettings, TestResult} from '@applitools/types'
import {type Logger} from '@applitools/logger'

type Options<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TDriver, TElement, TSelector, TType>
  logger: Logger
}

export function makeCheckAndClose<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg' = 'classic' | 'ufg'>({
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TElement, TSelector, TType>) {
  return async function checkAndClose({
    target,
    settings = {},
    config,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver, TType>
    settings?: CheckSettings<TElement, TSelector, TType> & CloseSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  } = {}): Promise<TestResult<TType>[]> {
    settings = {...config?.screenshot, ...config?.check, ...config?.close, ...settings}
    const results = await eyes.checkAndClose({target: target as any, settings: settings as any, logger})
    return results
  }
}

import type {Eyes, Config, CloseSettings, TestResult} from '@applitools/types'
import {type Logger} from '@applitools/logger'
import {TestError} from './errors/test-error'

type Options<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TDriver, TElement, TSelector, TType>
  logger: Logger
}

export function makeClose<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg' = 'classic'>({
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TElement, TSelector, TType>) {
  return async function close({
    settings,
    config,
    logger = defaultLogger,
  }: {
    settings: CloseSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<TestResult<TType>[]> {
    settings = {...config?.close, ...settings}
    const results = await eyes.close({settings, logger})
    if (settings.throwErr) {
      results.forEach(result => {
        if (result.status !== 'Passed') throw new TestError(result)
      })
    }
    return results
  }
}

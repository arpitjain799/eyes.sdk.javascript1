import type {Target, Eyes, Config, CloseSettings, TestResult} from './types'
import {type Logger} from '@applitools/logger'
import {TestError} from './errors/test-error'
import {makeDriver, isDriver, type SpecDriver} from '@applitools/driver'

type Options<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TDriver, TContext, TElement, TSelector, TType>
  target?: Target<TDriver, TContext, TElement, TSelector, TType>
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger: Logger
}

export function makeClose<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'>({
  eyes,
  target,
  spec,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector, TType>) {
  return async function close({
    settings,
    config,
    logger = defaultLogger,
  }: {
    settings?: CloseSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  } = {}): Promise<TestResult<TType>[]> {
    settings = {...config?.close, ...settings}
    settings.updateBaselineIfNew ??= true
    const typedEyes = await eyes.getTypedEyes({logger})

    const driver = isDriver(target, spec) ? await makeDriver({spec, driver: target, logger}) : null
    const report = await driver.getSessionMetadata()
    await typedEyes.reportSelfHealing(report)

    const results = await typedEyes.close({settings, logger})
    if (settings.throwErr) {
      results.forEach(result => {
        if (result.status !== 'Passed') throw new TestError(result)
      })
    }
    return results.length > 0
      ? results
      : [
          {
            userTestId: eyes.test.userTestId,
            name: '',
            steps: 0,
            matches: 0,
            mismatches: 0,
            missing: 0,
            exactMatches: 0,
            strictMatches: 0,
            contentMatches: 0,
            layoutMatches: 0,
            noneMatches: 0,
          },
        ]
  }
}

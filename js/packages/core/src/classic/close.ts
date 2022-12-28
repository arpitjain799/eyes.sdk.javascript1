import type {CloseSettings, TestResult} from './types'
import type {Eyes} from './types'
import {type Logger} from '@applitools/logger'
import type {DriverTarget} from './types'
import {makeDriver, type SpecDriver} from '@applitools/driver'

type Options<TDriver, TContext, TElement, TSelector> = {
  eyes: Eyes<TDriver, TContext, TElement, TSelector>
  target?: DriverTarget<TDriver, TContext, TElement, TSelector>
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger: Logger
}

export function makeClose<TDriver, TContext, TElement, TSelector>({
  eyes,
  target,
  spec,
  logger: defaultLogger
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function ({
    settings,
    logger = defaultLogger,
  }: {
    settings?: CloseSettings
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    const driver = await makeDriver({spec, driver: target, logger})
    const sessionMetadata = await driver.getSessionMetadata()
    const selfHealingReport = sessionMetadata // TODO: write transform for selfHealingReport

    const result = await eyes.close({settings: {...settings, selfHealingReport}, logger})
    return result
  }
}

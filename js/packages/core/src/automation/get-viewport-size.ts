import type {Core} from './types'
import {type Logger} from '@applitools/logger'
import {makeDriver, type Driver, type SpecDriver} from '@applitools/driver'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger?: Logger
}

export function makeGetViewportSize<TDriver, TContext, TElement, TSelector>({
  spec,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>): Core<TDriver, TContext, TElement, TSelector>['getViewportSize'] {
  return async function getViewportSize({
    driver,
    target,
    logger = defaultLogger,
  }: {
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    target?: TDriver
    logger?: Logger
  }) {
    logger.log(`Command "getViewportSize" is called with ${driver ? 'driver' : 'target'}`)
    driver ??= await makeDriver<TDriver, TContext, TElement, TSelector>({spec, driver: target, logger})
    return driver.getViewportSize()
  }
}

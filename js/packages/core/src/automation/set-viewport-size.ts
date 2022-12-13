import type {Size} from '@applitools/utils'
import type {Core} from './types'
import {type Logger} from '@applitools/logger'
import {makeDriver, type Driver, type SpecDriver} from '@applitools/driver'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger?: Logger
}

export function makeSetViewportSize<TDriver, TContext, TElement, TSelector>({
  spec,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>): Core<TDriver, TContext, TElement, TSelector>['setViewportSize'] {
  return async function setViewportSize({
    driver,
    target,
    size,
    logger = defaultLogger,
  }: {
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    target?: TDriver
    size: Size
    logger?: Logger
  }) {
    logger.log(`Command "setViewportSize" is called with ${driver ? 'driver' : 'target'} and size`, size)
    driver ??= await makeDriver<TDriver, TContext, TElement, TSelector>({spec, driver: target, logger})
    return driver.setViewportSize(size)
  }
}

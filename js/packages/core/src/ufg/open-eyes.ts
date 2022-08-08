import type {SpecDriver} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import type {Eyes, Target, OpenSettings} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'
import {makeDriver} from '@applitools/driver'
import {makeCheck} from './check'
import {makeCheckAndClose} from './check-and-close'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  core: BaseCore
  logger?: Logger
}

export function makeOpenEyes<TDriver, TContext, TElement, TSelector>({
  spec,
  core,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function ({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver>
    settings: OpenSettings
    logger?: Logger
    on?: any
  }): Promise<Eyes<TDriver, TElement, TSelector>> {
    const driver = spec.isDriver(target) ? await makeDriver({spec, driver: target, logger}) : null
    logger.log(`Command "openEyes" is called with ${driver ? 'default driver and' : ''} settings`, settings)

    // TODO driver custom config

    if (driver) {
      if (driver.isWeb && (!settings.renderers || settings.renderers.length === 0)) {
        const size = await driver.getViewportSize()
        settings.renderers = [{name: 'chrome', ...size}]
      }
    }

    const eyes = await core.openEyes({settings, logger})

    return {
      ...eyes,
      check: makeCheck({spec, eyes, target, logger}),
      checkAndClose: makeCheckAndClose({spec, eyes, target, logger}),
    }
  }
}

import type {SpecDriver} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import type {Eyes, Target, OpenSettings} from '@applitools/types/classic'
import {type Logger} from '@applitools/logger'
import {Driver} from '@applitools/driver'
import {makeCheck} from './check'
import * as utils from '@applitools/utils'

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
    const driver = spec.isDriver(target) ? new Driver({spec, driver: target, logger}) : null
    logger.log(`Command "openEyes" is called with ${driver ? 'default driver and' : ''} settings`, settings)

    // TODO driver custom config

    if (driver) {
      settings.environment ??= {}
      if (!settings.environment.viewportSize || driver.isMobile) {
        const size = await driver.getViewportSize()
        settings.environment.viewportSize = utils.geometry.scale(size, driver.viewportScale)
      } else {
        await driver.setViewportSize(settings.environment.viewportSize)
      }

      if (!settings.environment.userAgent && driver.isWeb) {
        settings.environment.userAgent = driver.userAgent
      }

      if (!settings.environment.deviceName && driver.deviceName) {
        settings.environment.deviceName = driver.deviceName
      }

      if (!settings.environment.os && driver.isNative && driver.platformName) {
        settings.environment.os = driver.platformName
        if (driver.platformVersion) {
          settings.environment.os += ` ${this._driver.platformVersion}`
        }
      }
    }

    const eyes = await core.openEyes({settings, logger})

    return {
      check: makeCheck({spec, eyes, target, logger}),
      checkAndClose: makeCheckAndClose({spec, eyes, target, logger}),
      locate: null,
      locateText: null,
      extractText: null,
      close: null,
      abort: null,
    }
  }
}

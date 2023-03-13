import type {Region} from '@applitools/utils'
import type {Target, Core, LocateSettings, Config} from './types'
import {type Logger} from '@applitools/logger'
import {type SpecType, type SpecDriver} from '@applitools/driver'
import {makeCore as makeClassicCore} from './classic/core'
import * as utils from '@applitools/utils'

type Options<TSpec extends SpecType> = {
  spec?: SpecDriver<TSpec>
  core: Core<TSpec>
  logger: Logger
}

export function makeLocate<TSpec extends SpecType>({spec, core, logger: defaultLogger}: Options<TSpec>) {
  return async function locate<TLocator extends string>({
    target,
    settings,
    config,
    logger = defaultLogger,
  }: {
    target: Target<TSpec, 'classic'>
    settings: LocateSettings<TLocator, TSpec>
    config?: Config<TSpec, 'classic'>
    logger?: Logger
  }): Promise<Record<TLocator, Region[]>> {
    settings = {...config?.open, ...config?.screenshot, ...settings}
    settings.serverUrl ??= utils.general.getEnvValue('SERVER_URL') ?? 'https://eyesapi.applitools.com'
    settings.apiKey ??= utils.general.getEnvValue('API_KEY')

    const classicCore = makeClassicCore({spec, base: core.base, logger})
    const results = await classicCore.locate({target, settings, logger})
    return results
  }
}

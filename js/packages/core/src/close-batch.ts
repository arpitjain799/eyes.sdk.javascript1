import type {MaybeArray} from '@applitools/utils'
import type {Core, CloseBatchSettings} from './types'
import {type Logger} from '@applitools/logger'
import * as utils from '@applitools/utils'

type Options = {
  core: Core<any>
  logger: Logger
}

export function makeCloseBatch({core, logger: defaultLogger}: Options) {
  return async function closeBatch({
    settings,
    logger = defaultLogger,
  }: {
    settings: MaybeArray<CloseBatchSettings>
    logger?: Logger
  }): Promise<void> {
    ;(utils.types.isArray(settings) ? settings : [settings]).forEach(settings => {
      settings.serverUrl ??= utils.general.getEnvValue('SERVER_URL') ?? 'https://eyesapi.applitools.com'
      settings.apiKey ??= utils.general.getEnvValue('API_KEY')
    })

    await core.base.closeBatch({settings, logger})
  }
}

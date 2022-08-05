import type {MaybeArray} from '@applitools/types'
import type {Target, ExtractTextSettings} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import * as utils from '@applitools/utils'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeExtractText({requests, logger: defaultLogger}: Options) {
  return async function ({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: Target
    settings?: MaybeArray<ExtractTextSettings>
    logger?: Logger
  }): Promise<string[]> {
    logger.log('Command "extractText" is called with settings', settings)
    settings = utils.types.isArray(settings) ? settings : [settings]
    const results = await Promise.all(settings.map(settings => requests.extractText({target, settings})))
    return results.flat()
  }
}

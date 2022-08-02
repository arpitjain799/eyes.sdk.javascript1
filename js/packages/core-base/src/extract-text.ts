import type {MaybeArray} from '@applitools/types'
import type {Target, ExtractTextSettings} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import * as utils from '@applitools/utils'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeExtractText({requests, logger}: Options) {
  return async function ({target, settings}: {target: Target; settings?: MaybeArray<ExtractTextSettings>}): Promise<string[]> {
    settings = utils.types.isArray(settings) ? settings : [settings]
    const results = await Promise.all(settings.map(settings => requests.extractText({target, settings})))
    return results.flat()
  }
}

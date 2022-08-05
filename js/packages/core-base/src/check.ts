import type {MaybeArray} from '@applitools/types'
import type {Target, CheckSettings, CheckResult} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import * as utils from '@applitools/utils'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeCheck({requests, logger: defaultLogger}: Options) {
  return async function ({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: Target
    settings?: MaybeArray<CheckSettings>
    logger?: Logger
  }): Promise<CheckResult[]> {
    logger.log('Command "check" is called with settings', settings)
    settings = utils.types.isArray(settings) ? settings : [settings]
    const results = await Promise.all(settings.map(settings => requests.check({target, settings})))
    return results.flat()
  }
}

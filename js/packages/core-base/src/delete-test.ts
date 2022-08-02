import type {MaybeArray} from '@applitools/types'
import type {DeleteTestSettings} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type CoreRequests} from './server/requests'
import * as utils from '@applitools/utils'

type Options = {
  requests: CoreRequests
  logger: Logger
}

export function makeDeleteTest({requests, logger: defaultLogger}: Options) {
  return async function ({
    settings,
    logger = defaultLogger,
  }: {
    settings: MaybeArray<DeleteTestSettings>
    logger?: Logger
  }): Promise<void> {
    settings = utils.types.isArray(settings) ? settings : [settings]
    const results = await Promise.allSettled(settings.map(settings => requests.deleteTest({settings})))
    const error = results.find(({status}) => status === 'rejected') as PromiseRejectedResult
    if (error) throw error.reason
  }
}

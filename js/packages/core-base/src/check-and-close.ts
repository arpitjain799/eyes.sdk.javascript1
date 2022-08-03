import type {MaybeArray} from '@applitools/types'
import type {Target, CheckSettings, CloseSettings, TestResult} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import {TestError} from './errors/test-error'
import * as utils from '@applitools/utils'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeCheckAndClose({requests, logger}: Options) {
  return async function ({
    target,
    settings,
  }: {
    target: Target
    settings?: MaybeArray<CheckSettings & CloseSettings>
  }): Promise<TestResult[]> {
    logger.log('Command "checkAndClose" is called with settings', settings)
    settings = utils.types.isArray(settings) ? settings : [settings]
    const results = await Promise.all(settings.map(settings => requests.checkAndClose({target, settings})))
    settings.forEach((settings, index) => {
      if (settings.throwErr) {
        results[index].forEach(result => {
          if (result.status !== 'Passed') throw new TestError(result)
        })
      }
    })
    return results.flat()
  }
}

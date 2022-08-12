import type {Target, CheckSettings, CloseSettings, TestResult} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import {transformImage} from './utils/transform-image'
import {TestError} from './errors/test-error'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeCheckAndClose({requests, logger: defaultLogger}: Options) {
  return async function ({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: Target
    settings?: CheckSettings & CloseSettings
    logger?: Logger
  }): Promise<TestResult[]> {
    logger.log('Command "checkAndClose" is called with settings', settings)
    target.image = await transformImage({image: target.image, settings})
    const results = await requests.checkAndClose({target, settings})
    if (settings.throwErr) {
      results.forEach(result => {
        if (result.status !== 'Passed') throw new TestError(result)
      })
    }
    return results
  }
}

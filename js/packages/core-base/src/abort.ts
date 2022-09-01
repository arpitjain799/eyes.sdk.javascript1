import type {TestResult} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeAbort({requests, logger: defaultLogger}: Options) {
  return async function abort({logger = defaultLogger}: {logger?: Logger} = {}): Promise<TestResult[]> {
    logger.log('Command "abort" is called')
    const results = await requests.abort()
    return results
  }
}

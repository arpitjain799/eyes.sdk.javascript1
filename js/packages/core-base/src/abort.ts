import type {TestResult} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeAbort({requests, logger}: Options) {
  return async function (): Promise<TestResult[]> {
    logger.log('Command "abort" is called')
    const results = await requests.abort()
    return results.flat()
  }
}

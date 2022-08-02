import type {CloseSettings, TestResult} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'
import {TestError} from './errors/test-error'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeClose({requests, logger}: Options) {
  return async function ({settings}: {settings?: CloseSettings}): Promise<TestResult[]> {
    const results = await requests.close({settings})
    if (settings.throwErr) {
      results.forEach(result => {
        if (result.status !== 'Passed') throw new TestError(result)
      })
    }
    return results
  }
}

import type {TextRegion} from '@applitools/types'
import type {Target, LocateTextSettings} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {type EyesRequests} from './server/requests'

type Options = {
  requests: EyesRequests
  logger: Logger
}

export function makeLocateText({requests, logger}: Options) {
  return async function <TPattern extends string>({
    target,
    settings,
  }: {
    target: Target
    settings?: LocateTextSettings<TPattern>
  }): Promise<Record<TPattern, TextRegion[]>> {
    const results = await requests.locateText({target, settings})
    return results
  }
}

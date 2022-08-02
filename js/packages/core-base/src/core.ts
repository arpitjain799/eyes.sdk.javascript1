import {type Core} from '@applitools/types/base'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeCoreRequests} from './server/requests'
import {makeOpenEyes} from './open-eyes'
import {makeCloseBatch} from './close-batch'
import {makeDeleteTest} from './delete-test'

type Options = {
  agentId: string
  logger?: Logger
  cwd?: string
}

export function makeCore({agentId, logger, cwd = process.cwd()}: Options): Core {
  logger = logger?.extend({label: 'core-base'}) ?? makeLogger({label: 'core-base'})
  const coreRequests = makeCoreRequests({agentId, logger})

  return {
    openEyes: makeOpenEyes({requests: coreRequests, logger, cwd}),
    closeBatch: makeCloseBatch({requests: coreRequests, logger}),
    deleteTest: makeDeleteTest({requests: coreRequests, logger}),
  }
}

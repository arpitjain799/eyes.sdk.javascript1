import type {EyesManager, Eyes, SpecDriver, TestResult} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {makeCore as makeBaseCore} from '@applitools/core-base'
import {makeCore as makeClassicCore} from './classic/core'
import {makeCore as makeUFGCore} from './ufg/core'
import {makeOpenEyes} from './open-eyes'
import {makeCloseManager} from './close-manager'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  core?: BaseCore
  concurrency?: number
  agentId?: string
  cwd?: string
  logger?: Logger
}

export function makeMakeManager<TDriver, TContext, TElement, TSelector>({
  spec,
  core,
  concurrency: defaultConcurrency,
  agentId: defaultAgentId,
  cwd = process.cwd(),
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function makeManager<TType extends 'classic' | 'ufg' = 'classic'>({
    type,
    concurrency = defaultConcurrency,
    agentId = type === 'ufg' ? defaultAgentId?.replace(/(\/\d)/, '.visualgrid$1') : defaultAgentId,
    logger = defaultLogger,
  }: {
    type?: TType
    concurrency?: number
    agentId?: string
    logger?: Logger
  } = {}): Promise<EyesManager<TDriver, TElement, TSelector, TType>> {
    core ??= makeBaseCore({agentId, cwd, logger})
    const typedCore = type === 'ufg' ? makeUFGCore({spec, core, concurrency, logger}) : makeClassicCore({spec, core, logger})

    const storage = [] as {eyes: Eyes<TDriver, TElement, TSelector, TType>; promise?: Promise<TestResult<TType>[]>}[]
    // open eyes with result storage
    const openEyes = utils.general.wrap(makeOpenEyes({spec, core: typedCore, logger}), async (openEyes, options) => {
      const eyes = await openEyes(options)
      const item = {eyes} as typeof storage[number]
      storage.push(item)
      return utils.general.extend(eyes, {
        close(options) {
          const promise = eyes.close(options)
          item.promise ??= promise
          return promise
        },
        abort(options) {
          const promise = eyes.abort(options)
          item.promise ??= promise
          return promise
        },
      })
    })

    return {
      openEyes,
      closeManager: makeCloseManager({core: typedCore, storage, logger}),
    }
  }
}

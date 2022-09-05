import type {EyesManager, Eyes, SpecDriver, TestResult} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {makeCore as makeBaseCore} from '@applitools/core-base'
import {makeCore as makeClassicCore} from './classic/core'
import {makeCore as makeUFGCore} from './ufg/core'
import {makeOpenEyes} from './open-eyes'
import {makeCloseManager} from './close-manager'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  baseCore?: BaseCore
  concurrency?: number
  agentId?: string
  cwd?: string
  logger?: Logger
}

export function makeMakeManager<TDriver, TContext, TElement, TSelector>({
  spec,
  baseCore,
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
    baseCore ??= makeBaseCore({agentId, cwd, logger})

    const core =
      type === 'ufg' ? makeUFGCore({spec, core: baseCore, concurrency, logger}) : makeClassicCore({spec, core: baseCore, logger})

    const storage = [] as {
      eyes: Eyes<TDriver, TElement, TSelector, TType>
      shouldCloseBatch: boolean
      promise?: Promise<TestResult<TType>[]>
    }[]

    const openEyes = makeOpenEyes({spec, core, logger})
    return {
      openEyes: async options => {
        const eyes = await openEyes(options)
        const item = {eyes, shouldCloseBatch: !options.settings.dontCloseBatches} as typeof storage[number]
        storage.push(item)
        return {
          ...eyes,
          close: options => {
            const promise = eyes.close(options)
            item.promise ??= promise
            return promise
          },
          abort: options => {
            const promise = eyes.close(options)
            item.promise ??= promise
            return promise
          },
        }
      },
      closeManager: makeCloseManager({core, storage, logger}),
    }
  }
}

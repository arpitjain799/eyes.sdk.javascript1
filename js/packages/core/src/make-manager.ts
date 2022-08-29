import type {EyesManager, Eyes, SpecDriver, TestResult} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {makeCore as makeClassicCore} from './classic/core'
import {makeCore as makeUFGCore} from './ufg/core'
import {makeCloseManager} from './close-manager'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  core: BaseCore
  concurrency?: number
  logger?: Logger
}

export function makeMakeManager<TDriver, TContext, TElement, TSelector>({
  spec,
  core,
  concurrency: defaultConcurrency,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function makeManager<TType extends 'classic' | 'ufg' = 'classic' | 'ufg'>({
    type,
    concurrency = defaultConcurrency,
    logger = defaultLogger,
  }: {
    type?: TType
    concurrency?: number
    logger?: Logger
  }): Promise<EyesManager<TDriver, TElement, TSelector, TType>> {
    const specificCore = type === 'ufg' ? makeUFGCore({spec, core, concurrency, logger}) : makeClassicCore({spec, core, logger})
    const allEyes = [] as {eyes: Eyes<TDriver, TElement, TSelector, TType>; resultsPromise?: Promise<TestResult<TType>[]>}[]

    const openEyesWithStorage: typeof specificCore.openEyes = async (...args) => {
      const eyes = await specificCore.openEyes(...args)
      const storage = {eyes} as typeof allEyes[number]
      allEyes.push(storage)
      const closeWithStorage: typeof eyes.close = (...args) => {
        const closePromise = eyes.close(...args)
        storage.resultsPromise ??= closePromise
        return closePromise
      }
      const abortWithStorage: typeof eyes.abort = (...args) => {
        const abortPromise = eyes.close(...args)
        storage.resultsPromise ??= abortPromise
        return abortPromise
      }
      return {
        ...eyes,
        close: closeWithStorage,
        abort: abortWithStorage,
      } as any
    }

    return {
      openEyes: openEyesWithStorage,
      closeManager: makeCloseManager({core: specificCore, eyes: allEyes, logger}),
    } as EyesManager<TDriver, TElement, TSelector, TType>
  }
}

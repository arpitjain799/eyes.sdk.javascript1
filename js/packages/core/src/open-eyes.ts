import type {Eyes, Config, OpenSettings, SpecDriver} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import {type Logger} from '@applitools/logger'
import {makeCore as makeClassicCore} from './classic/core'
import {makeCore as makeUFGCore} from './ufg/core'
import {makeCheck} from './check'
import {makeCheckAndClose} from './check-and-close'
import {makeLocate} from './locate'
import {makeLocateText} from './locate-text'
import {makeExtractText} from './extract-text'
import {makeClose} from './close'

type Options<TDriver, TContext, TElement, TSelector> = {
  spec: SpecDriver<TDriver, TContext, TElement, TSelector>
  core: BaseCore
  concurrency?: number
  logger?: Logger
}

export function makeOpenEyes<TDriver, TContext, TElement, TSelector>({
  spec,
  core,
  concurrency,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function openEyes<TType extends 'classic' | 'ufg' = 'classic'>({
    type,
    target,
    settings,
    config,
    logger = defaultLogger,
  }: {
    type?: TType
    target?: TDriver
    settings?: OpenSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<Eyes<TDriver, TElement, TSelector, TType>> {
    settings = {...config?.open, ...settings}
    const specificCore = type === 'ufg' ? makeUFGCore({spec, core, concurrency, logger}) : makeClassicCore({spec, core, logger})
    const eyes: Eyes<TDriver, TElement, TSelector, TType> = (await specificCore.openEyes({target, settings, logger})) as any
    return {
      ...eyes,
      check: makeCheck<TDriver, TElement, TSelector, TType>({eyes, logger}),
      checkAndClose: makeCheckAndClose<TDriver, TElement, TSelector, TType>({eyes, logger}),
      locate: makeLocate<TDriver, TElement, TSelector, TType>({eyes, logger}),
      locateText: makeLocateText<TDriver, TElement, TSelector, TType>({eyes, logger}),
      extractText: makeExtractText<TDriver, TElement, TSelector, TType>({eyes, logger}),
      close: makeClose<TDriver, TElement, TSelector, TType>({eyes, logger}),
    } as Eyes<TDriver, TElement, TSelector, TType>
  }
}

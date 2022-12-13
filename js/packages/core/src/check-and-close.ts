import type {Target, Config, CheckSettings, CloseSettings, TestResult} from './types'
import type {Eyes as ClassicEyes} from './classic/types'
import type {Eyes as UFGEyes} from './ufg/types'
import {type Logger} from '@applitools/logger'

type Options<TDriver, TContext, TElement, TSelector> = {
  type?: 'classic' | 'ufg'
  getTypedEyes<TType extends 'classic' | 'ufg'>(options: {
    type: TType
    renderers: any[]
  }): Promise<
    TType extends 'ufg' ? UFGEyes<TDriver, TContext, TElement, TSelector> : ClassicEyes<TDriver, TContext, TElement, TSelector>
  >
  logger: Logger
}

export function makeCheckAndClose<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg' = 'classic' | 'ufg'>({
  type: defaultType,
  getTypedEyes,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function checkAndClose({
    type = defaultType as TType,
    target,
    settings = {},
    config,
    logger = defaultLogger,
  }: {
    type?: TType
    target?: Target<TDriver, TType>
    settings?: CheckSettings<TElement, TSelector, TType> & CloseSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  } = {}): Promise<TestResult<TType>[]> {
    settings = {...config?.screenshot, ...config?.check, ...config?.close, ...settings} as CheckSettings<
      TElement,
      TSelector,
      'classic'
    > &
      CloseSettings<'classic'>

    const eyes = await getTypedEyes({type, renderers: (settings as any).renderers})

    const results = await (eyes as ClassicEyes<TDriver, TContext, TElement, TSelector>).checkAndClose({
      target: target as any,
      settings: settings as any,
      logger,
    })
    return results
  }
}

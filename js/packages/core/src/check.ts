import type {Target, Config, CheckSettings, CheckResult} from './types'
import type {Eyes as ClassicEyes} from './classic/types'
import type {Eyes as UFGEyes} from './ufg/types'
import {type Logger} from '@applitools/logger'
import * as utils from '@applitools/utils'
import chalk from 'chalk'

type Options<TDriver, TContext, TElement, TSelector> = {
  type?: 'classic' | 'ufg'
  getTypedEyes<TType extends 'classic' | 'ufg'>(options: {
    type: TType
    renderers: any[]
  }): Promise<
    TType extends 'ufg' ? UFGEyes<TDriver, TContext, TElement, TSelector> : ClassicEyes<TDriver, TContext, TElement, TSelector>
  >
  logger?: Logger
}

export function makeCheck<TDriver, TContext, TElement, TSelector, TType extends 'classic' | 'ufg'>({
  type: defaultType,
  getTypedEyes,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function check({
    type = defaultType as TType,
    target,
    settings,
    config,
    logger = defaultLogger,
  }: {
    type?: TType
    target?: Target<TDriver, TType>
    settings?: CheckSettings<TElement, TSelector, TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  } = {}): Promise<CheckResult<TType>[]> {
    settings = {...config?.screenshot, ...config?.check, ...settings}

    const eyes = await getTypedEyes({type, renderers: (settings as any).renderers})

    settings.fully ??= !settings.region && (!settings.frames || settings.frames.length === 0)
    settings.waitBeforeCapture ??= 100
    settings.stitchMode ??= 'Scroll'
    settings.hideScrollbars ??= true
    settings.hideCaret ??= true
    settings.overlap ??= {top: 10, bottom: 50}
    settings.matchLevel ??= 'Strict'
    settings.ignoreCaret ??= true
    settings.sendDom ??=
      eyes.test.account.rcaEnabled || settings.matchLevel === 'Layout' || settings.enablePatterns || settings.useDom
    settings.autProxy ??= eyes.test.server.proxy
    settings.useDom ??= false
    ;(settings as CheckSettings<TElement, TSelector, 'classic'>).retryTimeout ??= 2000
    settings.lazyLoad = settings.lazyLoad === true ? {} : settings.lazyLoad
    if (settings.lazyLoad) {
      settings.lazyLoad.scrollLength ??= 300
      settings.lazyLoad.waitingTime ??= 2000
      settings.lazyLoad.maxAmountToScroll ??= 15000
    }
    settings.waitBetweenStitches ??= utils.types.isObject(settings.lazyLoad) ? settings.lazyLoad.waitingTime : 100

    if (settings.matchLevel === 'Content') {
      logger.console.log(chalk.yellow(`The "Content" match level value has been deprecated, use "IgnoreColors" instead.`))
    }

    const results = await (eyes as any).check({target: target as any, settings, logger})
    return results
  }
}

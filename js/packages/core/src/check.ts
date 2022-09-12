import type {Target, Config, CheckSettings, CheckResult} from '@applitools/types'
import type {Eyes as ClassicEyes} from '@applitools/types/classic'
import type {Eyes as UFGEyes} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'

type Options<TDriver, TElement, TSelector> = {
  eyes: ClassicEyes<TDriver, TElement, TSelector> | UFGEyes<TDriver, TElement, TSelector>
  logger: Logger
}

export function makeCheck<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'>({
  eyes,
  logger: defaultLogger,
}: Options<TDriver, TElement, TSelector>) {
  return async function check({
    target,
    settings = {},
    config,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver, TType>
    settings?: CheckSettings<TElement, TSelector, TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  } = {}): Promise<CheckResult<TType>[]> {
    settings = {...config?.screenshot, ...config?.check, ...settings}
    settings.fully ??= !settings.region && (!settings.frames || settings.frames.length === 0)
    settings.sendDom ??= true
    settings.waitBeforeCapture ??= 100
    settings.waitBetweenStitches ??= 100
    settings.stitchMode ??= 'Scroll'
    settings.hideScrollbars ??= true
    settings.hideCaret ??= true
    settings.overlap ??= {top: 10, bottom: 50}
    settings.matchLevel ??= 'Strict'
    settings.ignoreCaret ??= true
    settings.useDom ?? false
    ;(settings as CheckSettings<TElement, TSelector, 'classic'>).maxDuration ??= 2000

    const results = await eyes.check({target: target as any, settings, logger})
    return results
  }
}

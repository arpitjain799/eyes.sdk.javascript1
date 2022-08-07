import {MaybeArray} from './types'
import {AutProxy, Renderer} from './data'
import {Logger} from './debug'
import * as AutomationCore from './core-automation'

export * from './core-automation'

export interface Core<TDriver, TElement, TSelector> extends AutomationCore.Core<TDriver, TElement, TSelector> {
  openEyes(options: {
    target?: AutomationCore.Target<TDriver>
    settings: OpenSettings
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<Eyes<TDriver, TElement, TSelector>>
}

export interface Eyes<TDriver, TElement, TSelector> extends AutomationCore.Eyes<TDriver, TElement, TSelector> {
  check(options: {
    target: AutomationCore.Target<TDriver>
    settings?: MaybeArray<CheckSettings<TElement, TSelector>>
    logger?: Logger
  }): Promise<AutomationCore.CheckResult[]>
  checkAndClose(options: {
    target: AutomationCore.Target<TDriver>
    settings?: CheckSettings<TElement, TSelector> & AutomationCore.CloseSettings
    logger?: Logger
  }): Promise<AutomationCore.TestResult[]>
}

export type OpenSettings = AutomationCore.OpenSettings & {concurrentSessions?: number; renderers?: Renderer[]}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> & {
  hooks?: {beforeCaptureScreenshot: string}
  disableBrowserFetching?: boolean
  layoutBreakpoints?: boolean | number[]
  ufgOptions?: Record<string, any>
  autProxy?: AutProxy
}

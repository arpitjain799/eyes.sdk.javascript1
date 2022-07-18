import {AutProxy, Renderer} from './data'
import {Logger} from './debug'
import * as AutomationCore from './core-automation'

export * from './core-automation'

export interface Core<TDriver, TElement, TSelector> extends AutomationCore.Core<TDriver, TElement, TSelector> {
  openEyes(options: {
    target?: TDriver
    config?: Config
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<Eyes<TDriver, TElement, TSelector>>
}

export interface Eyes<TDriver, TElement, TSelector> extends AutomationCore.Eyes<TDriver, TElement, TSelector> {
  check(options: {
    target: AutomationCore.Target<TDriver>
    settings?: CheckSettings<TElement, TSelector> | CheckSettings<TElement, TSelector>[]
    config?: Config & {defaultCheckSettings: CheckSettings<TElement, TSelector>}
  }): Promise<AutomationCore.CheckResult[]>
}

export type UFGConfig = {
  autProxy?: AutProxy
  concurrentSessions?: number
  renderers?: Renderer[]
}

export type Config = AutomationCore.Config & UFGConfig

export type UFGCheckSettings = {
  hooks?: {beforeCaptureScreenshot: string}
  disableBrowserFetching?: boolean
  layoutBreakpoints?: boolean | number[]
  ufgOptions?: Record<string, any>
  renderId?: string
  variationGroupId?: string
}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> & UFGCheckSettings

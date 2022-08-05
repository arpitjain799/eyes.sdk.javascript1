import {Logger} from './debug'
import * as BaseCore from './core-base'
import * as AutomationCore from './core-automation'

export * from './core-automation'

export type Target<TDriver> = AutomationCore.Target<TDriver> | BaseCore.Target

export interface Core<TDriver, TElement, TSelector>
  extends AutomationCore.Core<TDriver, TElement, TSelector, Eyes<TDriver, TElement, TSelector>> {
  openEyes(options: {
    target?: AutomationCore.Target<TDriver>
    settings: AutomationCore.OpenSettings
    logger?: Logger
  }): Promise<Eyes<TDriver, TElement, TSelector>>
}

export interface Eyes<TDriver, TElement, TSelector, TTarget = Target<TDriver>>
  extends AutomationCore.Eyes<TDriver, TElement, TSelector, TTarget> {
  check(options: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector>
    logger?: Logger
  }): Promise<AutomationCore.CheckResult[]>
  checkAndClose(options: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector> & AutomationCore.CloseSettings
    logger?: Logger
    logger?: Logger
  }): Promise<AutomationCore.TestResult[]>
}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> & {
  maxDuration?: number
}

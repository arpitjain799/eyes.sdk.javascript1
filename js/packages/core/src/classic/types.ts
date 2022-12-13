import type * as BaseCore from '@applitools/core-base/types'
import type * as AutomationCore from '../automation/types'
import {type Logger} from '@applitools/logger'
import {type Driver} from '@applitools/driver'

export * from '../automation/types'

export type Target<TDriver> = AutomationCore.Target<TDriver> | AutomationCore.Screenshot

export interface Core<TDriver, TContext, TElement, TSelector>
  extends AutomationCore.Core<TDriver, TContext, TElement, TSelector, Eyes<TDriver, TContext, TElement, TSelector>> {
  readonly type: 'classic'
  openEyes(options: {
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    settings: OpenSettings
    logger?: Logger
  }): Promise<Eyes<TDriver, TContext, TElement, TSelector>>
  openEyes(options: {
    target?: TDriver
    settings: OpenSettings
    logger?: Logger
  }): Promise<Eyes<TDriver, TContext, TElement, TSelector>>
  /** @internal */
  openEyes(options: {
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    eyes: BaseCore.Eyes[]
    logger?: Logger
  }): Promise<Eyes<TDriver, TContext, TElement, TSelector>>
  /** @internal */
  openEyes(options: {
    target?: TDriver
    eyes: BaseCore.Eyes[]
    logger?: Logger
  }): Promise<Eyes<TDriver, TContext, TElement, TSelector>>
}

export interface Eyes<TDriver, TContext, TElement, TSelector, TTarget = Target<TDriver>>
  extends AutomationCore.Eyes<TDriver, TContext, TElement, TSelector, TTarget> {
  readonly type: 'classic'
  check(options?: {
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    settings?: CheckSettings<TElement, TSelector>
    logger?: Logger
  }): Promise<AutomationCore.CheckResult[]>
  check(options?: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector>
    logger?: Logger
  }): Promise<AutomationCore.CheckResult[]>
  checkAndClose(options?: {
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    settings?: CheckSettings<TElement, TSelector> & AutomationCore.CloseSettings
    logger?: Logger
  }): Promise<AutomationCore.TestResult[]>
  checkAndClose(options?: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector> & AutomationCore.CloseSettings
    logger?: Logger
  }): Promise<AutomationCore.TestResult[]>
}

export type OpenSettings = AutomationCore.OpenSettings & {
  keepPlatformNameAsIs?: boolean
  useCeilForViewportSize?: boolean
}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> & {
  retryTimeout?: number
}

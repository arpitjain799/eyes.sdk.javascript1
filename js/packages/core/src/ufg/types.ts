import type {MaybeArray} from '@applitools/utils'
import type * as BaseCore from '@applitools/core-base/types'
import type * as AutomationCore from '../automation/types'
import {type Logger} from '@applitools/logger'
import {type Driver} from '@applitools/driver'
import {type Proxy} from '@applitools/req'
import {type Renderer, type DomSnapshot, type AndroidSnapshot, type IOSSnapshot} from '@applitools/ufg-client'

export * from '../automation/types'

export type Target<TDriver> =
  | AutomationCore.Target<TDriver>
  | MaybeArray<DomSnapshot>
  | MaybeArray<AndroidSnapshot>
  | MaybeArray<IOSSnapshot>

export interface Core<TDriver, TContext, TElement, TSelector>
  extends AutomationCore.Core<TDriver, TContext, TElement, TSelector, Eyes<TDriver, TContext, TElement, TSelector>> {
  readonly type: 'ufg'
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
  readonly type: 'ufg'
  getBaseEyes(options?: {settings?: {type: 'web' | 'native'; renderer: Renderer}; logger?: Logger}): Promise<BaseCore.Eyes[]>
  check(options?: {
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    settings?: CheckSettings<TElement, TSelector>
    logger?: Logger
  }): Promise<CheckResult[]>
  check(options?: {target?: TTarget; settings?: CheckSettings<TElement, TSelector>; logger?: Logger}): Promise<CheckResult[]>
  checkAndClose(options?: {
    driver?: Driver<TDriver, TContext, TElement, TSelector>
    settings?: CheckSettings<TElement, TSelector> & AutomationCore.CloseSettings
    logger?: Logger
  }): Promise<TestResult[]>
  checkAndClose(options?: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector> & AutomationCore.CloseSettings
    logger?: Logger
  }): Promise<TestResult[]>
  locateText?: never
  extractText?: never
  close(options?: {settings?: AutomationCore.CloseSettings; logger?: Logger}): Promise<TestResult[]>
  abort(options?: {logger?: Logger}): Promise<TestResult[]>
}

export type OpenSettings = AutomationCore.OpenSettings & {
  renderConcurrency?: number
}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> & {
  renderers?: Renderer[]
  hooks?: {beforeCaptureScreenshot: string}
  disableBrowserFetching?: boolean
  layoutBreakpoints?: boolean | number[]
  ufgOptions?: Record<string, any>
  autProxy?: Proxy & {mode?: 'Allow' | 'Block'; domains?: string[]}
}

export type CheckResult = AutomationCore.CheckResult & {
  readonly renderer?: Renderer
  readonly promise?: Promise<Omit<CheckResult, 'promise'> & {eyes: BaseCore.Eyes}>
}

export type TestResult = AutomationCore.TestResult & {
  readonly renderer?: Renderer
}

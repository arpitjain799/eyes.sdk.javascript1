import {MaybeArray} from './types'
import {Region, Renderer, TextRegion} from './data'
import {Logger} from './debug'
import * as AutomationCore from './core-automation'
import * as ClassicCore from './core-classic'
import * as UFGCore from './core-ufg'

export * from './core-base'

export type Target<TDriver, TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.Target<TDriver>
  : ClassicCore.Target<TDriver>

export interface Core<TDriver, TElement, TSelector> extends AutomationCore.Core<TDriver, TElement, TSelector> {
  openEyes<TType extends 'classic' | 'ufg' = 'classic'>(options: {
    type?: TType
    target?: TDriver
    settings?: OpenSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<Eyes<TDriver, TElement, TSelector, TType>>
  makeManager<TType extends 'classic' | 'ufg' = 'classic'>(options?: {
    type: TType
    concurrency: TType extends 'ufg' ? number : never
    agentId?: string
    logger?: Logger
  }): Promise<EyesManager<TDriver, TElement, TSelector, TType>>
}

export interface EyesManager<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'> {
  openEyes(options: {
    target?: TDriver
    settings?: OpenSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
  }): Promise<Eyes<TDriver, TElement, TSelector, TType>>
  closeManager: (options?: {settings?: {throwErr?: boolean}; logger?: Logger}) => Promise<TestResultSummary<TType>>
}

export interface ClassicEyes<TDriver, TElement, TSelector, TTarget = Target<TDriver, 'classic'>>
  extends ClassicCore.Eyes<TDriver, TElement, TSelector, TTarget> {
  check(options: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector, 'classic'>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<CheckResult<'classic'>[]>
  checkAndClose(options: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector, 'classic'> & CloseSettings<'classic'>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<TestResult<'classic'>[]>
  locate<TLocator extends string>(options: {
    target?: TTarget
    settings: LocateSettings<TLocator, TElement, TSelector, 'classic'>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target?: TTarget
    settings: LocateTextSettings<TPattern, TElement, TSelector, 'classic'>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {
    target?: TTarget
    settings: MaybeArray<ExtractTextSettings<TElement, TSelector, 'classic'>>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<string[]>
  close(options?: {
    settings?: CloseSettings<'classic'>
    config?: Config<TElement, TSelector, 'classic'>
    logger?: Logger
  }): Promise<TestResult<'classic'>[]>
}

export interface UFGEyes<TDriver, TElement, TSelector, TTarget = Target<TDriver, 'ufg'>>
  extends UFGCore.Eyes<TDriver, TElement, TSelector, TTarget> {
  check(options: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector, 'ufg'>
    config?: Config<TElement, TSelector, 'ufg'>
    logger?: Logger
  }): Promise<CheckResult<'ufg'>[]>
  checkAndClose(options: {
    target?: TTarget
    settings?: CheckSettings<TElement, TSelector, 'ufg'> & CloseSettings<'ufg'>
    config?: Config<TElement, TSelector, 'ufg'>
    logger?: Logger
  }): Promise<TestResult<'ufg'>[]>
  close(options?: {
    settings?: CloseSettings<'ufg'>
    config?: Config<TElement, TSelector, 'ufg'>
    logger?: Logger
  }): Promise<TestResult<'ufg'>[]>
}

export type Eyes<
  TDriver,
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg',
  TTarget = Target<TDriver, TType>,
> = TType extends 'ufg'
  ? UFGEyes<TDriver, TElement, TSelector, TTarget>
  : ClassicEyes<TDriver, TElement, TSelector, TTarget>

export type Config<TElement, TSelector, TType extends 'classic' | 'ufg'> = {
  open: OpenSettings<TType>
  screenshot: ClassicCore.ScreenshotSettings<TElement, TSelector>
  check: Omit<CheckSettings<TElement, TSelector, TType>, keyof ClassicCore.ScreenshotSettings<TElement, TSelector>>
  close: CloseSettings<TType>
}

export type OpenSettings<TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.OpenSettings
  : ClassicCore.OpenSettings

export type CheckSettings<TElement, TSelector, TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.CheckSettings<TElement, TSelector>
  : ClassicCore.CheckSettings<TElement, TSelector>

export type LocateSettings<
  TLocator extends string,
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg',
> = TType extends 'ufg'
  ? UFGCore.LocateSettings<TLocator, TElement, TSelector>
  : ClassicCore.LocateSettings<TLocator, TElement, TSelector>

export type LocateTextSettings<
  TPattern extends string,
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg',
> = TType extends 'ufg'
  ? UFGCore.LocateTextSettings<TPattern, TElement, TSelector>
  : ClassicCore.LocateTextSettings<TPattern, TElement, TSelector>

export type ExtractTextSettings<TElement, TSelector, TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.ExtractTextSettings<TElement, TSelector>
  : ClassicCore.ExtractTextSettings<TElement, TSelector>

export type CloseSettings<TType extends 'classic' | 'ufg'> = (TType extends 'ufg'
  ? UFGCore.CloseSettings
  : ClassicCore.CloseSettings) & {throwErr?: boolean}

export type CheckResult<TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.CheckResult
  : ClassicCore.CheckResult

export type TestResult<TType extends 'classic' | 'ufg'> = TType extends 'ufg'
  ? UFGCore.TestResult
  : ClassicCore.TestResult

export interface TestResultContainer<TType extends 'classic' | 'ufg'> {
  readonly error?: Error
  readonly result?: TestResult<TType>
  readonly renderer?: TType extends 'ufg' ? Renderer : never
  readonly userTestId?: string
}

export interface TestResultSummary<TType extends 'classic' | 'ufg'> {
  readonly results: TestResultContainer<TType>[]
  readonly passed: number
  readonly unresolved: number
  readonly failed: number
  readonly exceptions: number
  readonly mismatches: number
  readonly missing: number
  readonly matches: number
}

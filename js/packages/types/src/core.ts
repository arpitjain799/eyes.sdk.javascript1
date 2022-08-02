import {MaybeArray} from './types'
import {Region, Renderer, TextRegion} from './data'
import {Logger} from './debug'
import * as ClassicCore from './core-classic'
import * as UFGCore from './core-ufg'

export * from './core-base'

export type Target<TDriver, TType extends 'ufg' | 'classic' = 'ufg' | 'classic'> = TType extends 'classic'
  ? ClassicCore.Target<TDriver>
  : UFGCore.Target<TDriver>

export interface Core<TDriver, TElement, TSelector>
  extends ClassicCore.Core<TDriver, TElement, TSelector>,
    UFGCore.Core<TDriver, TElement, TSelector> {
  openEyes<TType extends 'ufg' | 'classic' = 'ufg' | 'classic'>(options: {
    type?: TType
    target?: TDriver
    settings?: OpenSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<Eyes<TDriver, TElement, TSelector, TType>>
  makeManager<TType extends 'ufg' | 'classic' = 'ufg' | 'classic'>(options?: {
    type: TType
    concurrency: TType extends 'ufg' ? number : never
    legacy?: TType extends 'ufg' ? boolean : never
  }): Promise<EyesManager<TDriver, TElement, TSelector, TType>>
}

export interface EyesManager<TDriver, TElement, TSelector, TType extends 'ufg' | 'classic' = 'ufg' | 'classic'> {
  openEyes(options: {
    type?: TType
    target?: TDriver
    settings?: OpenSettings<TType>
    config?: Config<TElement, TSelector, TType>
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<Eyes<TDriver, TElement, TSelector, TType>>
  closeManager: (options?: {throwErr: boolean}) => Promise<TestResultSummary>
}

export interface Eyes<TDriver, TElement, TSelector, TType extends 'ufg' | 'classic' = 'ufg' | 'classic'>
  extends ClassicCore.Eyes<TDriver, TElement, TSelector>,
    UFGCore.Eyes<TDriver, TElement, TSelector> {
  check(options: {
    target?: Target<TDriver, TType>
    settings?: MaybeArray<CheckSettings<TElement, TSelector, TType>>
    config?: Config<TElement, TSelector, TType>
  }): Promise<CheckResult<TType>[]>
  checkAndClose(options: {
    target?: Target<TDriver, TType>
    settings?: MaybeArray<CheckSettings<TElement, TSelector, TType> & CloseSettings<TType>>
    config?: Config<TElement, TSelector, TType>
  }): Promise<TestResult<TType>[]>
  locate<TLocator extends string>(options: {
    target?: Target<TDriver, TType>
    settings: LocateSettings<TLocator, TElement, TSelector, TType>
    config?: Config<TElement, TSelector, TType>
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target?: Target<TDriver, TType>
    settings: LocateTextSettings<TPattern, TElement, TSelector, TType>
    config?: Config<TElement, TSelector, TType>
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {
    target?: Target<TDriver>
    settings: MaybeArray<ExtractTextSettings<TElement, TSelector, TType>>
    config?: Config<TElement, TSelector, TType>
  }): Promise<string[]>
  close(options?: {
    settings?: CloseSettings<TType>
    config?: Config<TElement, TSelector, TType>
  }): Promise<TestResult<TType>[]>
  abort(): Promise<TestResult<TType>[]>
}

export type Config<TElement, TSelector, TType extends 'classic' | 'ufg' = 'classic' | 'ufg'> = {
  open: OpenSettings<TType>
  screenshot: ClassicCore.ScreenshotSettings<TElement, TSelector>
  check: Omit<CheckSettings<TElement, TSelector, TType>, keyof ClassicCore.ScreenshotSettings<TElement, TSelector>>
  close: CloseSettings<TType>
}

export type OpenSettings<TType extends 'classic' | 'ufg' = 'classic' | 'ufg'> = TType extends 'classic'
  ? ClassicCore.OpenSettings
  : UFGCore.OpenSettings

export type CheckSettings<
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg' = 'classic' | 'ufg',
> = TType extends 'classic'
  ? ClassicCore.CheckSettings<TElement, TSelector>
  : UFGCore.CheckSettings<TElement, TSelector>

export type LocateSettings<
  TLocator extends string,
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg' = 'classic' | 'ufg',
> = TType extends 'classic'
  ? ClassicCore.LocateSettings<TLocator, TElement, TSelector>
  : UFGCore.LocateSettings<TLocator, TElement, TSelector>

export type LocateTextSettings<
  TPattern extends string,
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg' = 'classic' | 'ufg',
> = TType extends 'classic'
  ? ClassicCore.LocateTextSettings<TPattern, TElement, TSelector>
  : UFGCore.LocateTextSettings<TPattern, TElement, TSelector>

export type ExtractTextSettings<
  TElement,
  TSelector,
  TType extends 'classic' | 'ufg' = 'classic' | 'ufg',
> = TType extends 'classic'
  ? ClassicCore.ExtractTextSettings<TElement, TSelector>
  : UFGCore.ExtractTextSettings<TElement, TSelector>

export type CloseSettings<TType extends 'classic' | 'ufg' = 'classic' | 'ufg'> = TType extends 'classic'
  ? ClassicCore.CloseSettings
  : UFGCore.CloseSettings

export type CheckResult<TType extends 'classic' | 'ufg' = 'classic' | 'ufg'> = TType extends 'classic'
  ? ClassicCore.CheckResult
  : UFGCore.CheckResult

export type TestResult<TType extends 'classic' | 'ufg' = 'classic' | 'ufg'> = TType extends 'classic'
  ? ClassicCore.TestResult
  : UFGCore.TestResult

export interface TestResultContainer<TType extends 'classic' | 'ufg' = 'classic' | 'ufg'> {
  readonly exception?: Error
  readonly testResults?: TestResult<TType>
  readonly renderer: TType extends 'ufg' ? Renderer : never
}

export interface TestResultSummary<TType extends 'classic' | 'ufg' = 'classic' | 'ufg'> {
  readonly results: TestResultContainer<TType>[]
  readonly passed: number
  readonly unresolved: number
  readonly failed: number
  readonly exceptions: number
  readonly mismatches: number
  readonly missing: number
  readonly matches: number
}

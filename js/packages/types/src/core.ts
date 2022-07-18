import {Renderer} from './data'
import {Logger} from './debug'
import * as ClassicCore from './core-classic'
import * as UFGCore from './core-ufg'

export * from './core-base'

export interface Core<TDriver, TElement, TSelector, TType extends 'ufg' | 'classic' = 'ufg' | 'classic'>
  extends ClassicCore.Core<TDriver, TElement, TSelector>,
    UFGCore.Core<TDriver, TElement, TSelector> {
  openEyes(options: {
    type?: TType
    target?: TDriver
    config?: TType extends 'classic' ? ClassicCore.Config : UFGCore.Config
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<
    TType extends 'classic'
      ? ClassicCore.Eyes<TDriver, TElement, TSelector>
      : UFGCore.Eyes<TDriver, TElement, TSelector>
  >
  makeManager(config?: {
    type: TType
    concurrency: TType extends 'ufg' ? number : never
    legacy?: TType extends 'ufg' ? boolean : never
  }): Promise<EyesManager<TType, TDriver, TElement, TSelector>>
}

export interface EyesManager<TType extends 'ufg' | 'classic', TDriver, TElement, TSelector> {
  openEyes(options: {
    target?: TDriver
    config?: TType extends 'ufg' ? UFGCore.Config : ClassicCore.Config
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<
    TType extends 'ufg' ? UFGCore.Eyes<TDriver, TElement, TSelector> : ClassicCore.Eyes<TDriver, TElement, TSelector>
  >
  closeManager: (options?: {throwErr: boolean}) => Promise<TestResultSummary>
}

export type Eyes<TDriver, TElement, TSelector> =
  | ClassicCore.Eyes<TDriver, TElement, TSelector>
  | UFGCore.Eyes<TDriver, TElement, TSelector>

export type Config = ClassicCore.Config & UFGCore.Config

export type CheckSettings<TElement, TSelector> = ClassicCore.CheckSettings<TElement, TSelector> &
  UFGCore.CheckSettings<TElement, TSelector>

export type LocateSettings<TLocator extends string, TElement, TSelector> = ClassicCore.LocateSettings<
  TLocator,
  TElement,
  TSelector
> &
  UFGCore.LocateSettings<TLocator, TElement, TSelector>

export type LocateTextSettings<TPattern extends string, TElement, TSelector> = ClassicCore.LocateTextSettings<
  TPattern,
  TElement,
  TSelector
> &
  UFGCore.LocateTextSettings<TPattern, TElement, TSelector>

export type ExtractTextSettings<TElement, TSelector> = ClassicCore.ExtractTextSettings<TElement, TSelector> &
  UFGCore.ExtractTextSettings<TElement, TSelector>

export type CheckResult = ClassicCore.CheckResult & UFGCore.CheckResult

export type TestResult = ClassicCore.TestResult & UFGCore.TestResult

export type TestResultContainer = {
  readonly exception?: Error
  readonly testResults?: TestResult
  readonly browserInfo?: Renderer
}

export type TestResultSummary = {
  results: TestResultContainer[]
  passed: number
  unresolved: number
  failed: number
  exceptions: number
  mismatches: number
  missing: number
  matches: number
}

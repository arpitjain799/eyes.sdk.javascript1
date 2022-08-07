import {MaybeArray} from './types'
import {ImageCropRect, ImageCropRegion, ImageRotation, Region, TextRegion} from './data'
import {DebugScreenshotHandler, Logger} from './debug'
import * as AutomationCore from './core-automation'

export * from './core-automation'

export interface Core<TDriver, TElement, TSelector> extends AutomationCore.Core<TDriver, TElement, TSelector> {
  openEyes(options: {
    target?: AutomationCore.Target<TDriver>
    settings: AutomationCore.OpenSettings
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
  locate<TLocator extends string>(options: {
    target?: AutomationCore.Target<TDriver>
    settings: LocateSettings<TLocator, TElement, TSelector>
    logger?: Logger
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target?: AutomationCore.Target<TDriver>
    settings: LocateTextSettings<TPattern, TElement, TSelector>
    logger?: Logger
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {
    target?: AutomationCore.Target<TDriver>
    settings: MaybeArray<ExtractTextSettings<TElement, TSelector>>
    logger?: Logger
  }): Promise<string[]>
}

export type ScreenshotSettings<TElement, TSelector> = AutomationCore.ScreenshotSettings<TElement, TSelector> & {
  debugScreenshots?: DebugScreenshotHandler
  cut?: ImageCropRect | ImageCropRegion
  rotation?: ImageRotation
  scaleRatio?: number
}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> &
  ScreenshotSettings<TElement, TSelector> & {timeout?: number}

export type LocateSettings<TLocator extends string, TElement, TSelector> = AutomationCore.LocateSettings<
  TLocator,
  TElement,
  TSelector
> &
  ScreenshotSettings<TElement, TSelector>

export type LocateTextSettings<TPattern extends string, TElement, TSelector> = AutomationCore.LocateTextSettings<
  TPattern,
  TElement,
  TSelector
> &
  ScreenshotSettings<TElement, TSelector>

export type ExtractTextSettings<TElement, TSelector> = AutomationCore.ExtractTextSettings<TElement, TSelector> &
  ScreenshotSettings<TElement, TSelector>

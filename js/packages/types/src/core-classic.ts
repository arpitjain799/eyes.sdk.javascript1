import {MaybeArray} from './types'
import {ImageCropRect, ImageCropRegion, ImageRotation, Region, TextRegion} from './data'
import {DebugScreenshotHandler, Logger} from './debug'
import * as AutomationCore from './core-automation'

export * from './core-automation'

export interface Core<TDriver, TElement, TSelector> extends AutomationCore.Core<TDriver, TElement, TSelector> {
  openEyes(options: {
    target?: TDriver
    settings: AutomationCore.OpenSettings
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<Eyes<TDriver, TElement, TSelector>>
}

export interface Eyes<TDriver, TElement, TSelector> extends AutomationCore.Eyes<TDriver, TElement, TSelector> {
  check(options: {
    target: AutomationCore.Target<TDriver>
    settings?: MaybeArray<CheckSettings<TElement, TSelector>>
  }): Promise<AutomationCore.CheckResult[]>
  checkAndClose(options: {
    target: AutomationCore.Target<TDriver>
    settings?: MaybeArray<CheckSettings<TElement, TSelector> & AutomationCore.CloseSettings>
  }): Promise<AutomationCore.TestResult[]>
  locate<TLocator extends string>(options: {
    target?: AutomationCore.Target<TDriver>
    settings: LocateSettings<TLocator, TElement, TSelector>
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target?: AutomationCore.Target<TDriver>
    settings: LocateTextSettings<TPattern, TElement, TSelector>
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {
    target?: AutomationCore.Target<TDriver>
    settings: MaybeArray<ExtractTextSettings<TElement, TSelector>>
  }): Promise<string[]>
}

type ClassicScreenshotSettings = {
  debugScreenshots?: DebugScreenshotHandler
  cut?: ImageCropRect | ImageCropRegion
  rotation?: ImageRotation
  scaleRatio?: number
}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> &
  ClassicScreenshotSettings & {timeout?: number}

export type LocateSettings<TLocator extends string, TElement, TSelector> = AutomationCore.LocateSettings<
  TLocator,
  TElement,
  TSelector
> &
  ClassicScreenshotSettings

export type LocateTextSettings<TPattern extends string, TElement, TSelector> = AutomationCore.LocateTextSettings<
  TPattern,
  TElement,
  TSelector
> &
  ClassicScreenshotSettings

export type ExtractTextSettings<TElement, TSelector> = AutomationCore.ExtractTextSettings<TElement, TSelector> &
  ClassicScreenshotSettings

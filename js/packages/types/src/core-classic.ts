import {CheckResult, ImageCropRect, ImageCropRegion, ImageRotation, Region, TextRegion} from './data'
import {DebugScreenshotHandler, Logger} from './debug'
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
  }): Promise<CheckResult[]>
  locate<TLocator extends string>(options: {
    target?: AutomationCore.Target<TDriver>
    settings: AutomationCore.LocateSettings<TLocator, TElement, TSelector>
    config?: Config
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target?: AutomationCore.Target<TDriver>
    settings: AutomationCore.LocateTextSettings<TPattern, TElement, TSelector>
    config?: Config
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {
    target?: AutomationCore.Target<TDriver>
    regions: AutomationCore.ExtractTextSettings<TElement, TSelector>[]
    config?: Config
  }): Promise<string[]>
}

export type ClassicConfig = {
  debugScreenshots?: DebugScreenshotHandler
  cut?: ImageCropRect | ImageCropRegion
  rotation?: ImageRotation
  scaleRatio?: number
}

export type Config = AutomationCore.Config & ClassicConfig

export type ClassicCheckSettings = {
  timeout?: number
}

export type CheckSettings<TElement, TSelector> = AutomationCore.CheckSettings<TElement, TSelector> &
  ClassicCheckSettings

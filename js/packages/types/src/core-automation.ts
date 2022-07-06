import {Region, TextRegion, CheckResult, StitchMode, LazyLoadOptions, Size} from './data'
import {Selector} from './driver'
import {Logger} from './debug'
import * as BaseCore from './core-base'

export * from './core-base'

export type Target<TDriver> = BaseCore.Target | TDriver

export interface Core<TDriver, TElement, TSelector> extends BaseCore.Core {
  isDriver(driver: any): driver is TDriver
  isElement(element: any): element is TElement
  isSelector(selector: any): selector is TSelector
  getViewportSize(options: {driver: TDriver; logger?: Logger}): Promise<Size>
  setViewportSize(options: {driver: TDriver; size: Size; logger?: Logger}): Promise<void>
  openEyes(options: {
    target?: TDriver
    config?: BaseCore.Config
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<Eyes<TDriver, TElement, TSelector>>
}

export interface Eyes<TDriver, TElement, TSelector> extends BaseCore.Eyes {
  check(options: {
    target?: Target<TDriver>
    settings?: CheckSettings<TElement, TSelector> | CheckSettings<TElement, TSelector>[]
    config?: BaseCore.Config & {defaultCheckSettings: CheckSettings<TElement, TSelector>}
  }): Promise<CheckResult[]>
  locate<TLocator extends string>(options: {
    target?: Target<TDriver>
    settings: LocateSettings<TLocator, TElement, TSelector>
    config?: BaseCore.Config
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target?: Target<TDriver>
    settings: LocateTextSettings<TPattern, TElement, TSelector>
    config?: BaseCore.Config
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {
    target?: Target<TDriver>
    regions: ExtractTextSettings<TElement, TSelector>[]
    config?: BaseCore.Config
  }): Promise<string[]>
}

type RegionReference<TElement, TSelector> = Region | ElementReference<TElement, TSelector>
type ElementReference<TElement, TSelector> = TElement | Selector<TSelector>
type FrameReference<TElement, TSelector> = ElementReference<TElement, TSelector> | string | number
type ContextReference<TElement, TSelector> = {
  frame: FrameReference<TElement, TSelector>
  scrollRootElement?: ElementReference<TElement, TSelector>
}

export type ScreenshotSettings<TElement, TSelector> = {
  region?: RegionReference<TElement, TSelector>
  frames?: (ContextReference<TElement, TSelector> | FrameReference<TElement, TSelector>)[]
  fully?: boolean
  scrollRootElement?: ElementReference<TElement, TSelector>
  stitchMode?: StitchMode
  hideScrollbars?: boolean
  hideCaret?: boolean
  stitchOverlap?: number
  waitBeforeCapture?: number
  lazyLoad?: boolean | LazyLoadOptions
}

export type CheckSettings<TElement, TSelector> = BaseCore.CheckSettings<RegionReference<TElement, TSelector>> &
  ScreenshotSettings<TElement, TSelector>

export type LocateSettings<TLocator extends string, TElement, TSelector> = BaseCore.LocateSettings<TLocator> &
  ScreenshotSettings<TElement, TSelector>

export type LocateTextSettings<TPattern extends string, TElement, TSelector> = BaseCore.LocateTextSettings<TPattern> &
  ScreenshotSettings<TElement, TSelector>

export type ExtractTextSettings<TElement, TSelector> = BaseCore.ExtractTextSettings &
  ScreenshotSettings<TElement, TSelector>

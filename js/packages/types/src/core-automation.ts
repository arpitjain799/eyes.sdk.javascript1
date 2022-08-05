import {MaybeArray} from './types'
import {Region, TextRegion, StitchMode, LazyLoadOptions, Size} from './data'
import {Selector} from './driver'
import {Logger} from './debug'
import * as BaseCore from './core-base'

export * from './core-base'

export type Target<TDriver> = BaseCore.Target | TDriver

export interface Core<TDriver, TElement, TSelector> extends BaseCore.Core {
  isDriver(driver: any): driver is TDriver
  isElement(element: any): element is TElement
  isSelector(selector: any): selector is TSelector
  getViewportSize(options: {target: TDriver; logger?: Logger}): Promise<Size>
  setViewportSize(options: {target: TDriver; size: Size; logger?: Logger}): Promise<void>
  openEyes(options: {
    target?: TDriver
    settings: BaseCore.OpenSettings
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<Eyes<TDriver, TElement, TSelector>>
}

export interface Eyes<TDriver, TElement, TSelector> extends BaseCore.Eyes {
  check(options: {
    target?: Target<TDriver>
    settings?: MaybeArray<CheckSettings<TElement, TSelector>>
  }): Promise<BaseCore.CheckResult[]>
  checkAndClose(options: {
    target?: Target<TDriver>
    settings?: MaybeArray<CheckSettings<TElement, TSelector> & BaseCore.CloseSettings>
  }): Promise<BaseCore.TestResult[]>
  locate<TLocator extends string>(options: {
    target?: Target<TDriver>
    settings: LocateSettings<TLocator, TElement, TSelector>
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target?: Target<TDriver>
    settings: LocateTextSettings<TPattern, TElement, TSelector>
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {
    target?: Target<TDriver>
    settings: MaybeArray<ExtractTextSettings<TElement, TSelector>>
  }): Promise<string[]>
}

type RegionReference<TElement, TSelector> = Region | ElementReference<TElement, TSelector>
type ElementReference<TElement, TSelector> = TElement | Selector<TSelector>
type FrameReference<TElement, TSelector> = ElementReference<TElement, TSelector> | string | number
type ContextReference<TElement, TSelector> = {
  frame: FrameReference<TElement, TSelector>
  scrollRootElement?: ElementReference<TElement, TSelector>
}
export interface ScreenshotSettings<TElement, TSelector> {
  region?: RegionReference<TElement, TSelector>
  frames?: (ContextReference<TElement, TSelector> | FrameReference<TElement, TSelector>)[]
  fully?: boolean
  scrollRootElement?: ElementReference<TElement, TSelector>
  stitchMode?: StitchMode
  hideScrollbars?: boolean
  hideCaret?: boolean
  overlap?: {top?: number; bottom?: number}
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

import type {MaybeArray, Size, Region} from '@applitools/utils'
import type * as BaseCore from '@applitools/core-base/types'
import {type SpecType, type Driver, type ElementReference, type ContextReference} from '@applitools/driver'
import {type Logger} from '@applitools/logger'

export * from '@applitools/core-base/types'

export type DriverTarget<TSpec extends SpecType> = TSpec['driver'] | Driver<TSpec>
export type Target<TSpec extends SpecType> = DriverTarget<TSpec> | BaseCore.Target

export interface Core<
  TSpec extends SpecType,
  TTarget = Target<TSpec>,
  TEyes extends Eyes<TSpec, TTarget> = Eyes<TSpec, TTarget>,
> extends BaseCore.Core<TTarget, TEyes> {
  isDriver?(driver: any): driver is TSpec['driver']
  isElement?(element: any): element is TSpec['element']
  isSelector?(selector: any): selector is TSpec['selector']
  getViewportSize?(options: {target: DriverTarget<TSpec>; logger?: Logger}): Promise<Size>
  setViewportSize?(options: {target: DriverTarget<TSpec>; size: Size; logger?: Logger}): Promise<void>
  openEyes(options: {
    target?: DriverTarget<TSpec>
    settings: BaseCore.OpenSettings
    eyes?: BaseCore.Eyes[]
    logger?: Logger
  }): Promise<TEyes>
  locate<TLocator extends string>(options: {
    target: TTarget
    settings: LocateSettings<TLocator, TSpec>
    logger?: Logger
  }): Promise<BaseCore.LocateResult<TLocator>>
  locateText<TPattern extends string>(options: {
    target: TTarget
    settings: LocateTextSettings<TPattern, TSpec>
    logger?: Logger
  }): Promise<BaseCore.LocateTextResult<TPattern>>
  extractText(options: {
    target: TTarget
    settings: MaybeArray<ExtractTextSettings<TSpec>>
    logger?: Logger
  }): Promise<string[]>
}

export interface Eyes<TSpec extends SpecType, TTarget = Target<TSpec>> extends BaseCore.Eyes<TTarget> {
  getBaseEyes(options?: {logger?: Logger}): Promise<BaseCore.Eyes[]>
  check(options?: {target?: TTarget; settings?: CheckSettings<TSpec>; logger?: Logger}): Promise<BaseCore.CheckResult[]>
  checkAndClose(options?: {
    target?: TTarget
    settings?: CheckSettings<TSpec> & BaseCore.CloseSettings
    logger?: Logger
  }): Promise<BaseCore.TestResult[]>
}

export interface ScreenshotSettings<TSpec extends SpecType>
  extends BaseCore.ImageSettings<Region | ElementReference<TSpec>> {
  frames?: (ContextReference<TSpec> | {frame: ContextReference<TSpec>; scrollRootElement?: ElementReference<TSpec>})[]
  fully?: boolean
  scrollRootElement?: ElementReference<TSpec>
  stitchMode?: 'Scroll' | 'CSS'
  hideScrollbars?: boolean
  hideCaret?: boolean
  overlap?: {top?: number; bottom?: number}
  waitBeforeCapture?: number
  waitBetweenStitches?: number
  lazyLoad?: boolean | {scrollLength?: number; waitingTime?: number; maxAmountToScroll?: number}
  webview?: boolean | string
}

export type LocateSettings<TLocator extends string, TSpec extends SpecType> = BaseCore.LocateSettings<
  TLocator,
  Region | ElementReference<TSpec>
> &
  ScreenshotSettings<TSpec>

export type LocateTextSettings<TPattern extends string, TSpec extends SpecType> = BaseCore.LocateTextSettings<
  TPattern,
  Region | ElementReference<TSpec>
> &
  ScreenshotSettings<TSpec>

export type ExtractTextSettings<TSpec extends SpecType> = BaseCore.ExtractTextSettings<
  Region | ElementReference<TSpec>
> &
  ScreenshotSettings<TSpec>

export type CheckSettings<TSpec extends SpecType> = BaseCore.CheckSettings<Region | ElementReference<TSpec>> &
  ScreenshotSettings<TSpec>

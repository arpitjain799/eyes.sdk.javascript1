import type {Region} from '@applitools/types'
import {ScreenshotSettings} from '@applitools/types/classic'
import {type Logger} from '@applitools/logger'
import {type Driver, type Element} from '@applitools/driver'
import {takeScreenshot as legacyTakeScreenshot} from '@applitools/screenshoter'
import * as utils from '@applitools/utils'

export type Screenshot = {
  image: any
  region: Region
  scrollingElement: Element<unknown, unknown, unknown, unknown>
  restoreState(): Promise<void>
}

export async function takeScreenshot<TDriver, TContext, TElement, TSelector>({
  driver,
  settings,
  logger,
}: {
  driver: Driver<TDriver, TContext, TElement, TSelector>
  settings: ScreenshotSettings<TElement, TSelector>
  logger: Logger
}): Promise<Screenshot> {
  return legacyTakeScreenshot({
    driver,
    frames: settings?.frames.map(frame => {
      return utils.types.has(frame, 'frame')
        ? {reference: frame.frame, scrollingElement: frame.scrollRootElement}
        : {reference: frame}
    }),
    region: settings.region,
    fully: settings.fully,
    hideScrollbars: settings.hideScrollbars,
    hideCaret: settings.hideCaret,
    scrollingMode: settings.stitchMode?.toLowerCase(),
    overlap: settings.overlap,
    wait: settings.waitBeforeCapture,
    framed: driver.isNative,
    stabilization: {crop: settings.cut, scale: settings.scaleRatio, rotation: settings.rotation},
    debug: settings.debugScreenshots,
    logger,
  })
}

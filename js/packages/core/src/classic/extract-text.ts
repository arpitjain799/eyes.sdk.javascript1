import type {MaybeArray} from '@applitools/utils'
import type {ClassicTarget, DriverTarget, ImageTarget, Eyes, ExtractTextSettings} from './types'
import type {ExtractTextSettings as BaseExtractTextSettings} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {makeDriver, isDriver, isElementReference, type SpecDriver} from '@applitools/driver'
import {takeScreenshot} from '../automation/utils/take-screenshot'
import {takeDomCapture} from './utils/take-dom-capture'
import * as utils from '@applitools/utils'

const {getText} = require('@applitools/snippets')

type Options<TDriver, TContext, TElement, TSelector> = {
  eyes: Eyes<TDriver, TContext, TElement, TSelector>
  target?: DriverTarget<TDriver, TContext, TElement, TSelector>
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger: Logger
}

export function makeExtractText<TDriver, TContext, TElement, TSelector>({
  eyes,
  target: defaultTarget,
  spec,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function extractText({
    target = defaultTarget,
    settings,
    logger = defaultLogger,
  }: {
    target?: ClassicTarget<TDriver, TContext, TElement, TSelector>
    settings: MaybeArray<ExtractTextSettings<TElement, TSelector>>
    logger?: Logger
  }): Promise<string[]> {
    logger.log('Command "extractText" is called with settings', settings)
    if (!target) throw new Error('Method was called with no target')
    const [baseEyes] = await eyes.getBaseEyes()
    if (!isDriver(target, spec)) {
      return baseEyes.extractText({target, settings: settings as MaybeArray<BaseExtractTextSettings>, logger})
    }
    settings = utils.types.isArray(settings) ? settings : [settings]
    const driver = await makeDriver({spec, driver: target, logger})
    const results = await settings.reduce(async (prev, settings) => {
      const steps = await prev
      const screenshot = await takeScreenshot({driver, settings, logger})
      if (!settings.hint && isElementReference(settings.region, spec)) {
        const element = await driver.currentContext.element(settings.region)
        if (!element) throw new Error(`Unable to find element using provided selector`)
        settings.hint = await driver.currentContext.execute(getText, [element])
        if (settings.hint) settings.hint = settings.hint.replace(/[.\\+]/g, '\\$&')
      }
      const baseTarget: ImageTarget = {
        image: await screenshot.image.toPng(),
        size: utils.geometry.size(screenshot.region),
        locationInViewport: utils.geometry.location(screenshot.region),
      }
      if (driver.isWeb) {
        if (settings.fully) await screenshot.scrollingElement.setAttribute('data-applitools-scroll', 'true')
        else await screenshot.element?.setAttribute('data-applitools-scroll', 'true')
        baseTarget.dom = await takeDomCapture({driver, logger}).catch(() => undefined)
      }
      delete settings.region
      delete settings.normalization
      const results = await baseEyes.extractText({
        target: baseTarget,
        settings: settings as BaseExtractTextSettings,
        logger,
      })
      steps.push(results)
      return steps
    }, Promise.resolve([] as string[][]))
    return results.flat()
  }
}

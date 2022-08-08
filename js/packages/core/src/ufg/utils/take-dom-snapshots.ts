import type {Renderer} from '@applitools/types'
import {type Logger} from '@applitools/logger'
import {type Driver} from '@applitools/driver'
import {takeDomSnapshot, type DomSnapshotSettings} from './take-dom-snapshot'
import {extractRendererInfo} from './extract-renderer-info'
import chalk from 'chalk'

export type DomSnapshotsSettings = DomSnapshotSettings & {
  breakpoints
  renderers: Renderer[]
  getViewportSize
  getEmulatedDevicesSizes
  getIosDevicesSizes
}

export async function takeDomSnapshots<TDriver extends Driver<unknown, unknown, unknown, unknown>>({
  driver,
  settings,
  hooks,
  logger,
}: {
  driver: TDriver
  settings: DomSnapshotsSettings
  hooks: {beforeSnapshots?(): void | Promise<void>; beforeEachSnapshot?(): void | Promise<void>}
  logger: Logger
}) {
  const cookieJar = driver.features.allCookies ? await driver.getCookies().catch(() => []) : []
  const currentContext = driver.currentContext
  await hooks?.beforeSnapshots?.()

  if (!settings.breakpoints) {
    logger.log(`taking single dom snapshot`)
    await hooks?.beforeEachSnapshot?.()
    const snapshot = await takeDomSnapshot({
      context: currentContext,
      settings,
      hooks: {beforeEachContextSnapshot: !driver.features.allCookies ? collectCookies : undefined},
      logger,
    })
    return {snapshots: Array(settings.renderers.length).fill(snapshot), cookies: cookieJar}
  }

  const requiredWidths = await settings.renderers.reduce(async (prev, renderer, index) => {
    const {name, width} = await extractRendererInfo({renderer})
    const requiredWidths = await prev
    const requiredWidth = isStrictBreakpoints ? calculateBreakpoint({breakpoints: settings.breakpoints, value: width}) : width
    let renderers = requiredWidths.get(requiredWidth)
    if (!renderers) requiredWidths.set(requiredWidth, (renderers = []))
    renderers.push({name, width, index})
    return requiredWidths
  }, Promise.resolve(new Map<number, {name: string; width: number; index: number}[]>()))

  const isStrictBreakpoints = Array.isArray(settings.breakpoints)
  const smallestBreakpoint = Math.min(...(isStrictBreakpoints ? settings.breakpoints : []))

  if (isStrictBreakpoints && requiredWidths.has(smallestBreakpoint - 1)) {
    const smallestBrowsers = requiredWidths
      .get(smallestBreakpoint - 1)
      .map(({name, width}) => `(${name}, ${width})`)
      .join(', ')
    const message = chalk.yellow(
      `The following configuration's viewport-widths are smaller than the smallest configured layout breakpoint (${smallestBreakpoint} pixels): [${smallestBrowsers}]. As a fallback, the resources that will be used for these configurations have been captured on a viewport-width of ${smallestBreakpoint} - 1 pixels. If an additional layout breakpoint is needed for you to achieve better results - please add it to your configuration.`,
    )
    logger.console.log(message)
  }

  logger.log(`taking multiple dom snapshots for breakpoints:`, settings.breakpoints)
  logger.log(`required widths: ${[...requiredWidths.keys()].join(', ')}`)
  const viewportSize = await driver.getViewportSize()
  const snapshots = Array(settings.renderers.length)
  if (requiredWidths.has(viewportSize.width)) {
    logger.log(`taking dom snapshot for existing width ${viewportSize.width}`)
    await hooks?.beforeEachSnapshot?.()
    const snapshot = await takeDomSnapshot({
      context: currentContext,
      settings,
      hooks: {beforeEachContextSnapshot: !driver.features.allCookies ? collectCookies : undefined},
      logger,
    })
    requiredWidths.get(viewportSize.width).forEach(({index}) => (snapshots[index] = snapshot))
  }
  for (const [requiredWidth, browsersInfo] of requiredWidths.entries()) {
    logger.log(`taking dom snapshot for width ${requiredWidth}`)
    try {
      await driver.setViewportSize({width: requiredWidth, height: viewportSize.height})
    } catch (err) {
      logger.error(err)
      const actualViewportSize = await driver.getViewportSize()
      if (isStrictBreakpoints) {
        const failedBrowsers = browsersInfo.map(({name, width}) => `(${name}, ${width})`).join(', ')
        const message = chalk.yellow(
          `One of the configured layout breakpoints is ${requiredWidth} pixels, while your local browser has a limit of ${actualViewportSize.width}, so the SDK couldn't resize it to the desired size. As a fallback, the resources that will be used for the following configurations: [${failedBrowsers}] have been captured on the browser's limit (${actualViewportSize.width} pixels). To resolve this, you may use a headless browser as it can be resized to any size.`,
        )
        logger.console.log(message)
        logger.log(message)
      } else {
        const failedBrowsers = browsersInfo.map(({name}) => `(${name})`).join(', ')
        const message = chalk.yellow(
          `The following configurations [${failedBrowsers}] have a viewport-width of ${requiredWidth} pixels, while your local browser has a limit of ${actualViewportSize.width} pixels, so the SDK couldn't resize it to the desired size. As a fallback, the resources that will be used for these checkpoints have been captured on the browser's limit (${actualViewportSize.width} pixels). To resolve this, you may use a headless browser as it can be resized to any size.`,
        )
        logger.console.log(message)
        logger.log(message)
      }
    }
    await hooks?.beforeEachSnapshot?.()
    const snapshot = await takeDomSnapshot({
      context: currentContext,
      settings,
      hooks: {beforeEachContextSnapshot: !driver.features.allCookies ? collectCookies : undefined},
      logger,
    })
    browsersInfo.forEach(({index}) => (snapshots[index] = snapshot))
  }

  await driver.setViewportSize(viewportSize)
  return {snapshots, cookies: cookieJar}

  async function collectCookies({context}) {
    cookieJar.push(...(await context.getCookies()))
  }

  function calculateBreakpoint({breakpoints, value}: {breakpoints: number[]; value: number}): number {
    const nextBreakpointIndex = breakpoints.findIndex(breakpoint => breakpoint > value)
    if (nextBreakpointIndex === -1) return breakpoints[breakpoints.length - 1]
    else if (nextBreakpointIndex === 0) return breakpoints[0] - 1
    else return breakpoints[nextBreakpointIndex - 1]
  }
}

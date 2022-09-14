import type {SpecDriver} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import type {Eyes, Target, OpenSettings, TestInfo} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'
import {AbortController} from 'abort-controller'
import {makeDriver} from '@applitools/driver'
import {makeUFGClient, type UFGClient} from '@applitools/ufg-client'
import {makeCheck} from './check'
import {makeCheckAndClose} from './check-and-close'
import {makeClose} from './close'
import {makeAbort} from './abort'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  core: BaseCore
  client?: UFGClient
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger?: Logger
}

export function makeOpenEyes<TDriver, TContext, TElement, TSelector>({
  spec,
  core,
  client,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>) {
  return async function openEyes({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target?: Target<TDriver>
    settings: OpenSettings
    logger?: Logger
    on?: any
  }): Promise<Eyes<TDriver, TElement, TSelector>> {
    logger.log(`Command "openEyes" is called with ${spec?.isDriver(target) ? 'default driver and' : ''} settings`, settings)

    if (spec?.isDriver(target)) {
      const driver = await makeDriver({spec, driver: target, logger})

      if (settings.environment?.viewportSize) {
        await driver.setViewportSize(settings.environment.viewportSize)
      }
    }

    const account = await core.getAccountInfo({settings, logger})
    const test = {
      userTestId: settings.userTestId,
      batchId: settings.batch?.id,
      server: {serverUrl: settings.serverUrl, apiKey: settings.apiKey, proxy: settings.proxy},
      account,
    } as TestInfo
    client ??= makeUFGClient({config: {...account.ufg, ...account}, concurrency: settings.renderConcurrency ?? 5, logger})

    const controller = new AbortController()

    // get eyes per environment
    const getEyes = utils.general.cachify(async ({rawEnvironment}) => {
      const eyes = await core.openEyes({settings: {...settings, environment: {rawEnvironment}}, logger})
      const h = makeHolderPromise()
      const queue = []
      eyes.check = utils.general.wrap(eyes.check, async (check, options) => {
        const index = (options.settings as any).index
        queue[index] ??= makeHolderPromise()
        if (index > 0) await Promise.race([(queue[index - 1] ??= makeHolderPromise()).promise, h.promise])
        return check(options).finally(queue[index].resolve)
      })
      eyes.abort = utils.general.wrap(eyes.abort, async (abort, options) => {
        h.reject()
        return abort(options)
      })
      return eyes
    })

    const check = makeCheck({
      spec,
      getEyes,
      client,
      signal: controller.signal,
      test,
      target,
      logger,
    })
    const checks = []
    let index = 0
    const checkWithInterception: typeof check = async options => {
      ;(options.settings as any).index = index++
      const results = await check(options)
      checks.push(...results.map(result => result.promise))
      return results
    }

    let closed = false
    const close = makeClose({checks, logger})
    const closeOnlyOnce: typeof close = options => {
      if (closed || aborted) return Promise.resolve([])
      closed = true
      return close(options)
    }
    let aborted = false
    const abort = makeAbort({checks, controller, logger})
    const abortOnlyOnce: typeof abort = options => {
      if (aborted || closed) return Promise.resolve([])
      aborted = true
      return abort(options)
    }

    return {
      test,
      get running() {
        return !closed && !aborted
      },
      get closed() {
        return closed
      },
      get aborted() {
        return aborted
      },
      check: checkWithInterception,
      checkAndClose: makeCheckAndClose({
        spec,
        getEyes,
        client,
        test,
        target,
        logger,
      }),
      close: closeOnlyOnce,
      abort: abortOnlyOnce,
    }
  }
}

function makeHolderPromise(): {promise: Promise<void>; resolve(): void; reject(reason?: any): void} {
  let resolve, reject
  const promise = new Promise<void>((...args) => ([resolve, reject] = args))
  return {promise, resolve, reject}
}

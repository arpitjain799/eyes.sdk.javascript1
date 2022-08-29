import type {SpecDriver} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import type {Eyes, Target, OpenSettings} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'
import {makeUFGClient, type UFGClient} from '@applitools/ufg-client'
import {makeCheck} from './check'
import {makeCheckAndClose} from './check-and-close'
import {makeClose} from './close'
import {makeAbort} from './abort'
import * as utils from '@applitools/utils'
import throat from 'throat'

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

    const account = await core.getAccountInfo({settings, logger})
    client ??= makeUFGClient({config: {...account.ufg, ...account}, logger})
    const clientWithConcurrency = {...client, render: throat(settings.renderConcurrency ?? 5, client.render)}

    const getEyesWithLockAndCache = utils.general.cachify(async ({rawEnvironment}) => {
      const eyes = await core.openEyes({settings: {...settings, environment: {rawEnvironment}}, logger})
      const eyesWithLock = {...eyes, check: throat(1, eyes.check)}
      return eyesWithLock
    })

    const check = makeCheck({
      spec,
      getEyes: getEyesWithLockAndCache,
      client: clientWithConcurrency,
      proxy: settings.proxy,
      target,
      logger,
    })
    const checkPromises = []
    const checkWithInterception: typeof check = async (...args) => {
      const results = await check(...args)
      checkPromises.push(...results.map(result => result.promise))
      return results
    }

    return {
      test: {
        testId: null,
        sessionId: null,
        baselineId: null,
        batchId: settings.batch?.id,
        isNew: null,
        resultsUrl: null,
        server: {serverUrl: settings.serverUrl, apiKey: settings.apiKey, proxy: settings.proxy},
        account,
      },
      check: checkWithInterception,
      checkAndClose: makeCheckAndClose({
        spec,
        getEyes: getEyesWithLockAndCache,
        client: clientWithConcurrency,
        proxy: settings.proxy,
        target,
        logger,
      }),
      close: makeClose({checkPromises, logger}),
      abort: makeAbort({checkPromises, logger}),
    }
  }
}

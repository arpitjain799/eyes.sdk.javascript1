import type {SpecDriver} from '@applitools/types'
import type {Core as BaseCore} from '@applitools/types/base'
import type {Core} from '@applitools/types/ufg'
import {type UFGClient} from '@applitools/ufg-client'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeCore as makeBaseCore} from '@applitools/core-base'
import {makeGetViewportSize} from '../automation/get-viewport-size'
import {makeSetViewportSize} from '../automation/set-viewport-size'
import {makeOpenEyes} from './open-eyes'
import * as utils from '@applitools/utils'
import throat from 'throat'

type Options<TDriver, TContext, TElement, TSelector> = {
  concurrency: number
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  client?: UFGClient
  core?: BaseCore
  agentId?: string
  cwd?: string
  logger?: Logger
}

export function makeCore<TDriver, TContext, TElement, TSelector>({
  concurrency,
  spec,
  client,
  core,
  agentId = 'core-ufg',
  cwd = process.cwd(),
  logger,
}: Options<TDriver, TContext, TElement, TSelector>): Core<TDriver, TElement, TSelector> {
  logger = logger?.extend({label: 'core-ufg'}) ?? makeLogger({label: 'core-ufg'})
  logger.log(`Core ufg is initialized ${core ? 'with' : 'without'} custom base core`)
  core ??= makeBaseCore({agentId, cwd, logger})

  const throttle = throat(concurrency)
  // openEyes with concurrency
  core.openEyes = utils.general.wrap(core.openEyes, (openEyes, options) => {
    return new Promise((resolve, rejects) => {
      throttle(() => {
        return new Promise<void>(async done => {
          try {
            const eyes = await openEyes(options)
            // release concurrency slot when closed
            eyes.close = utils.general.wrap(eyes.close, (close, options) => {
              return close(options).finally(done)
            })
            // release concurrency slot when aborted
            eyes.abort = utils.general.wrap(eyes.abort, (abort, options) => {
              return abort(options).finally(done)
            })
            resolve(eyes)
          } catch (error) {
            rejects(error)
            // release concurrency slot when error thrown
            done()
          }
        })
      })
    })
  })

  return {
    ...core,
    isDriver: spec?.isDriver,
    isElement: spec?.isElement,
    isSelector: spec?.isSelector,
    getViewportSize: makeGetViewportSize({spec, logger}),
    setViewportSize: makeSetViewportSize({spec, logger}),
    openEyes: makeOpenEyes({spec, client, core, logger}),
  }
}

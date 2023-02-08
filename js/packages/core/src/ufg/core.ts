import type {Core} from './types'
import type {Core as BaseCore} from '@applitools/core-base'
import {type UFGClient} from '@applitools/ufg-client'
import {type SpecType, type SpecDriver} from '@applitools/driver'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeCore as makeBaseCore} from '@applitools/core-base'
import {makeGetViewportSize} from '../automation/get-viewport-size'
import {makeSetViewportSize} from '../automation/set-viewport-size'
import {makeLocate} from '../automation/locate'
import {makeLocateText} from '../automation/locate-text'
import {makeExtractText} from '../automation/extract-text'
import {makeOpenEyes} from './open-eyes'
import * as utils from '@applitools/utils'
import throat from 'throat'

type Options<TSpec extends SpecType> = {
  concurrency: number
  spec?: SpecDriver<TSpec>
  client?: UFGClient
  core?: BaseCore
  agentId?: string
  cwd?: string
  logger?: Logger
}

export function makeCore<TSpec extends SpecType>({
  concurrency,
  spec,
  client,
  core,
  agentId = 'core-ufg',
  cwd = process.cwd(),
  logger,
}: Options<TSpec>): Core<TSpec> {
  logger = logger?.extend({label: 'core-ufg'}) ?? makeLogger({label: 'core-ufg'})
  logger.log(`Core ufg is initialized ${core ? 'with' : 'without'} custom base core`)

  const throttle = throat(concurrency)

  core ??= makeBaseCore({agentId, cwd, logger})
  // open eyes with concurrency
  core.openEyes = utils.general.wrap(core.openEyes, (openEyes, options) => {
    return new Promise((resolve, rejects) => {
      throttle(() => {
        return new Promise<void>(async done => {
          try {
            const eyes = await openEyes(options)
            resolve(
              utils.general.extend(eyes, {
                // release concurrency slot when closed
                close: utils.general.wrap(eyes.close, (close, options) => close(options).finally(done)),
                // release concurrency slot when aborted
                abort: utils.general.wrap(eyes.abort, (abort, options) => abort(options).finally(done)),
                // release concurrency slot when checkAndClose is done
                checkAndClose: utils.general.wrap(eyes.checkAndClose, (checkAndClose, options) =>
                  checkAndClose(options).finally(done),
                ),
              }),
            )
          } catch (error) {
            rejects(error)
            // release concurrency slot when error thrown
            done()
          }
        })
      })
    })
  })

  return utils.general.extend(core, {
    type: 'ufg' as const,
    isDriver: spec && spec.isDriver,
    isElement: spec && spec.isElement,
    isSelector: spec && spec.isSelector,
    getViewportSize: spec && makeGetViewportSize({spec, logger}),
    setViewportSize: spec && makeSetViewportSize({spec, logger}),
    locate: makeLocate({spec, core, logger}),
    locateText: makeLocateText({spec, core, logger}),
    extractText: makeExtractText({spec, core, logger}),
    openEyes: makeOpenEyes({spec, client, core, logger}),
  })
}

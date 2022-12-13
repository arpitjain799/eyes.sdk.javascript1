import type {Core, Eyes, Config, OpenSettings} from './types'
import type {Core as ClassicCore, Eyes as ClassicEyes} from './classic/types'
import type {Core as UFGCore, Eyes as UFGEyes} from './ufg/types'
import type {Core as BaseCore} from '@applitools/core-base'
import {type Logger} from '@applitools/logger'
import {type SpecDriver} from '@applitools/driver'
import {makeCore as makeClassicCore} from './classic/core'
import {makeCore as makeUFGCore} from './ufg/core'
import {makeCheck} from './check'
import {makeCheckAndClose} from './check-and-close'
import {makeLocateText} from './locate-text'
import {makeExtractText} from './extract-text'
import {makeClose} from './close'
import * as utils from '@applitools/utils'

type Options<TDriver, TContext, TElement, TSelector> = {
  type?: 'classic' | 'ufg'
  concurrency?: number
  core: BaseCore
  cores?: {classic: ClassicCore<TDriver, TContext, TElement, TSelector>; ufg: UFGCore<TDriver, TContext, TElement, TSelector>}
  spec?: SpecDriver<TDriver, TContext, TElement, TSelector>
  logger?: Logger
}

export function makeOpenEyes<TDriver, TContext, TElement, TSelector>({
  type: defaultType,
  concurrency,
  core,
  cores,
  spec,
  logger: defaultLogger,
}: Options<TDriver, TContext, TElement, TSelector>): Core<TDriver, TContext, TElement, TSelector>['openEyes'] {
  return async function openEyes<TType extends 'classic' | 'ufg' = 'classic'>({
    type = defaultType as TType,
    settings,
    config,
    target,
    logger = defaultLogger,
  }: {
    type?: TType
    settings?: Partial<OpenSettings<TType>>
    config?: Config<TElement, TSelector, TType>
    target?: TDriver
    logger?: Logger
  }): Promise<Eyes<TDriver, TContext, TElement, TSelector, TType>> {
    settings = {...config?.open, ...settings}
    settings.userTestId ??= `${settings.testName}--${utils.general.guid()}`
    settings.serverUrl ??= utils.general.getEnvValue('SERVER_URL') ?? 'https://eyesapi.applitools.com'
    settings.apiKey ??= utils.general.getEnvValue('API_KEY')
    settings.batch ??= {}
    settings.batch.id ??= utils.general.getEnvValue('BATCH_ID') ?? utils.general.guid()
    settings.batch.name ??= utils.general.getEnvValue('BATCH_NAME')
    settings.batch.sequenceName ??= utils.general.getEnvValue('BATCH_SEQUENCE')
    settings.batch.notifyOnCompletion ??= utils.general.getEnvValue('BATCH_NOTIFY', 'boolean')
    settings.keepBatchOpen ??= utils.general.getEnvValue('DONT_CLOSE_BATCHES', 'boolean')
    settings.branchName ??= utils.general.getEnvValue('BRANCH')
    settings.parentBranchName ??= utils.general.getEnvValue('PARENT_BRANCH')
    settings.baselineBranchName ??= utils.general.getEnvValue('BASELINE_BRANCH')
    settings.ignoreBaseline ??= false
    settings.compareWithParentBranch ??= false
    if (type === 'ufg') {
      ;(settings as OpenSettings<'ufg'>).renderConcurrency ??= (config as Config<any, any, 'ufg'>)?.check?.renderers?.length
    }

    core.logEvent({
      settings: {
        serverUrl: settings.serverUrl,
        apiKey: settings.apiKey,
        proxy: settings.proxy,
        agentId: settings.agentId,
        level: 'Notice',
        event: {
          type: 'runnerStarted',
          testConcurrency: concurrency,
          concurrentRendersPerTest: (settings as OpenSettings<'ufg'>).renderConcurrency,
          node: {version: process.version, platform: process.platform, arch: process.arch},
        },
      },
      logger,
    })

    cores ??= {
      ufg: makeUFGCore({spec, core, concurrency: concurrency ?? 5, logger}),
      classic: makeClassicCore({spec, core, logger}),
    }

    const eyes =
      type === 'ufg'
        ? await cores.ufg.openEyes({target, settings: settings as OpenSettings<'ufg'>, logger})
        : await cores.classic.openEyes({target, settings: settings as OpenSettings<'classic'>, logger})

    async function getTypedEyes<TType extends 'classic' | 'ufg'>({
      type = 'classic' as TType,
      renderers,
    }: {
      type?: TType
      renderers?: any[]
    }): Promise<
      TType extends 'ufg' ? UFGEyes<TDriver, TContext, TElement, TSelector> : ClassicEyes<TDriver, TContext, TElement, TSelector>
    > {
      if (eyes.type === type) {
        return eyes as any
      } else if (type === 'ufg') {
        const baseEyes = await eyes.getBaseEyes()
        return cores.ufg.openEyes({target, eyes: baseEyes, logger}) as any
      } else {
        const baseEyes = (
          await Promise.all(renderers.map(renderer => eyes.getBaseEyes({settings: {renderer, type: 'native'}})))
        ).flat()
        return cores.classic.openEyes({target, eyes: baseEyes, logger}) as any
      }
    }

    return utils.general.extend(eyes as Eyes<TDriver, TContext, TElement, TSelector, TType>, {
      check: makeCheck<TDriver, TContext, TElement, TSelector, TType>({type, getTypedEyes, logger}),
      checkAndClose: makeCheckAndClose<TDriver, TContext, TElement, TSelector, TType>({type, getTypedEyes, logger}),
      locateText: makeLocateText<TDriver, TContext, TElement, TSelector, TType>({eyes, logger}),
      extractText: makeExtractText<TDriver, TContext, TElement, TSelector, TType>({eyes, logger}),
      close: makeClose<TDriver, TContext, TElement, TSelector, TType>({eyes, logger}),
    })
  }
}

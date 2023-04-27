import type {Eyes, OpenSettings} from './types'
import type {Eyes as BaseEyes} from '@applitools/core-base'
import {type SpecType} from '@applitools/driver'
import {type Logger} from '@applitools/logger'
import {type RendererSettings} from '@applitools/ufg-client'
import * as utils from '@applitools/utils'

type Options<TSpec extends SpecType> = {
  settings: OpenSettings
  eyes: Eyes<TSpec>
  base?: BaseEyes[]
  logger: Logger
}

export function makeGetBaseEyes<TSpec extends SpecType>({
  settings: defaultSettings,
  eyes,
  base,
  logger: defaultLogger,
}: Options<TSpec>) {
  const getBaseEyesWithCache = utils.general.cachify(getBaseEyes, ([options]) => options?.settings)
  if (base) {
    base.forEach(baseEyes =>
      getBaseEyesWithCache.setCachedValue(baseEyes.test.rendererInfo, Promise.resolve([baseEyes])),
    )
  }
  return getBaseEyesWithCache

  async function getBaseEyes({
    settings,
    logger = defaultLogger,
  }: {
    settings?: RendererSettings
    logger?: Logger
  } = {}): Promise<BaseEyes[]> {
    logger.log(`Command "getBaseEyes" is called with settings`, settings)
    if (!settings) throw new Error('')
    const ufgClient = await eyes.core.getUFGClient({
      config: {...eyes.test.ufgServer},
      logger,
    })
    const environment = await ufgClient.bookRenderer({settings})
    const baseEyes = await eyes.core.base.openEyes({
      settings: {...defaultSettings, environment: {...defaultSettings.environment, ...environment}},
      logger,
    })
    return [baseEyes]
  }
}

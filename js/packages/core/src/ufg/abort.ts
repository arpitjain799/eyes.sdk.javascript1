import type {Renderer} from '@applitools/types'
import type {Eyes as BaseEyes} from '@applitools/types/base'
import type {TestResult} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'

type Options = {
  checkPromises: Promise<{eyes: BaseEyes; renderer: Renderer}>[]
  logger: Logger
}

export function makeAbort({checkPromises, logger: defaultLogger}: Options) {
  return async function ({
    logger = defaultLogger,
  }: {
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    const checkResults = await Promise.all(checkPromises)
    const eyes = checkResults.reduce((eyes, result) => {
      return eyes.set(result.eyes, result.renderer)
    }, new Map<BaseEyes, Renderer>())

    return Promise.all(
      Array.from(eyes.entries(), async ([eyes, renderer]) => {
        const [result] = await eyes.abort({logger})
        return {...result, renderer}
      }),
    )
  }
}

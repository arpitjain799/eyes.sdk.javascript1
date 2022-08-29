import type {Renderer} from '@applitools/types'
import type {Eyes as BaseEyes} from '@applitools/types/base'
import type {CloseSettings, TestResult} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'

type Options = {
  checkPromises: Promise<{eyes: BaseEyes; renderer: Renderer}>[]
  logger: Logger
}

export function makeClose({checkPromises, logger: defaultLogger}: Options) {
  return async function ({
    settings,
    logger = defaultLogger,
  }: {
    settings?: CloseSettings
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    const checkResults = await Promise.allSettled(checkPromises)

    let error
    const eyes = checkResults.reduce((eyes, result) => {
      let value
      if (result.status === 'fulfilled') {
        value = result.value
      } else {
        value = result.reason
        error ??= result.reason
      }

      return eyes.set(value.eyes, value.renderer)
    }, new Map<BaseEyes, Renderer>())

    if (error) {
      await Promise.all(
        Array.from(eyes.entries(), async ([eyes, renderer]) => {
          if (!eyes) return
          const [result] = await eyes.abort({logger})
          return {...result, renderer}
        }),
      )
      throw error
    } else {
      return Promise.all(
        Array.from(eyes.entries(), async ([eyes, renderer]) => {
          const [result] = await eyes.close({settings, logger})
          return {...result, renderer}
        }),
      )
    }
  }
}

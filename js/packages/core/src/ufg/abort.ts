import type {Renderer} from '@applitools/types'
import type {Eyes as BaseEyes} from '@applitools/types/base'
import type {TestResult} from '@applitools/types/ufg'
import {type Logger} from '@applitools/logger'
import {type AbortController} from 'abort-controller'

type Options = {
  checks: Promise<{eyes: BaseEyes; renderer: Renderer}>[]
  controller: AbortController
  logger: Logger
}

export function makeAbort({checks, controller, logger: defaultLogger}: Options) {
  return async function ({
    logger = defaultLogger,
  }: {
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    controller.abort()

    const results = await Promise.allSettled(checks)

    const eyes = results.reduce((eyes, result) => {
      const value = result.status === 'fulfilled' ? result.value : result.reason
      return eyes.set(value.eyes, value.renderer)
    }, new Map<BaseEyes, Renderer>())

    return Promise.all(
      Array.from(eyes.entries(), async ([eyes, renderer]) => {
        const [result] = await eyes.abort({logger})
        return {...result, renderer}
      }),
    )
  }
}

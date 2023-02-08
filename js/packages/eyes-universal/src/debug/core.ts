import type {Core} from '@applitools/core/types'
import {type SpecType} from '@applitools/driver'

export function makeDebugCore<TDriver, TContext, TElement, TSelector>(): Core<
  SpecType<TDriver, TContext, TElement, TSelector>,
  'classic' | 'ufg'
> {
  return {} as any
}

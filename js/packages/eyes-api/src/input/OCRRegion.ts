import type {SpecType} from '@applitools/core'
import {EyesSelector} from './EyesSelector'
import {Region} from './Region'

export type OCRRegion<TSpec extends SpecType = SpecType> = {
  target: Region | TSpec['element'] | EyesSelector<TSpec['selector']>
  hint?: string
  minMatch?: number
  language?: string
}

import {makeCore} from '@applitools/core'
import * as api from '@applitools/eyes-api'

const sdk = makeCore({
  agentId: `eyes.images.javascript/${require('../package.json').version}`,
})

export * from '@applitools/eyes-api'

export class Eyes extends api.Eyes<never, never, never> {
  protected static readonly _spec = {
    isDriver: () => false,
    isElement: () => false,
    isSelector: () => false,
    ...sdk,
  }
}

export type ConfigurationPlain = api.ConfigurationPlain<never, never>

export class Configuration extends api.Configuration<never, never> {}

export type OCRRegion = api.OCRRegion<never, never>

export type CheckSettingsPlain = api.CheckSettingsPlain<never, never>

export class CheckSettings extends api.CheckSettings<never, never> {}

export const Target: api.Target<never, never> = CheckSettings as any

export class BatchClose extends api.BatchClose {
  protected static readonly _spec = sdk
}

export const closeBatch = api.closeBatch(sdk)

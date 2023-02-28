import * as eyes from '@applitools/eyes'

export * from '@applitools/eyes'

const sdk = {agentId: `eyes.images.javascript/${require('../package.json').version}`}

export class Eyes extends eyes.Eyes<never> {
  protected static readonly _sdk = sdk
}

export type ConfigurationPlain = eyes.ConfigurationPlain<never>
export class Configuration extends eyes.Configuration<never> {}

export type OCRRegion = eyes.OCRRegion<never>

export class CheckSettings extends eyes.CheckSettingsImage {}

export const Target: eyes.TargetImage = eyes.CheckSettingsImage as any

export class BatchClose extends eyes.BatchClose {
  protected static readonly _sdk = sdk
}

export const closeBatch = eyes.closeBatch(sdk)

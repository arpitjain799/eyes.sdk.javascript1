import type {
  SpecType,
  Core,
  EyesManager,
  Eyes,
  ImageTarget,
  Config,
  CheckSettings,
  TestResultSummary,
  TestResultContainer,
  TestResult,
} from '@applitools/core'

export {SpecType}

export type CoreSpec<TSpec extends SpecType = SpecType> = Core<TSpec, 'classic' | 'ufg'>

export type CoreEyes<TSpec extends SpecType = SpecType> = Eyes<TSpec, 'classic' | 'ufg'>

export type CoreEyesManager<TSpec extends SpecType = SpecType> = EyesManager<TSpec, 'classic' | 'ufg'>

export type CoreTargetImage = ImageTarget

export type CoreConfig<TSpec extends SpecType = SpecType> = Config<TSpec, 'classic'> & Config<TSpec, 'ufg'>

export type CoreCheckSettingsAutomation<TSpec extends SpecType = SpecType> = CheckSettings<TSpec, 'classic'> &
  CheckSettings<TSpec, 'ufg'>

export type CoreCheckSettingsImage = CheckSettings<never, 'classic'>

export type CoreTestResultSummary = TestResultSummary<'classic' | 'ufg'>

export type CoreTestResultContainer = TestResultContainer<'classic' | 'ufg'>

export type CoreTestResult = TestResult<'classic' | 'ufg'>
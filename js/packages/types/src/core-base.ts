import {
  Region,
  TextRegion,
  CheckResult,
  TestResult,
  Environment,
  Batch,
  CustomProperty,
  SessionType,
  Proxy,
  MatchLevel,
  AccessibilityLevel,
  AccessibilityGuidelinesVersion,
  OffsetRect,
  AccessibilityRegionType,
} from './data'

import {Logger} from './debug'

export type Target = {image: Buffer | string; region: Region}

export interface Core {
  openEyes(options: {
    config?: Config
    logger?: Logger
    on?: (event: string, data?: Record<string, any>) => void
  }): Promise<Eyes>
  closeBatches(options: {settings: CloseBatchesSettings; logger?: Logger}): Promise<void>
  deleteTest(results: {settings: DeleteTestSettings; logger?: Logger}): Promise<void>
}

export interface Eyes {
  check(options: {
    target: Target
    settings?: CheckSettings | CheckSettings[]
    config?: Config & {defaultCheckSettings: CheckSettings}
  }): Promise<CheckResult[]>
  locate<TLocator extends string>(options: {
    target: Target
    settings: LocateSettings<TLocator>
    config?: Config
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target: Target
    settings: LocateTextSettings<TPattern>
    config?: Config
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {target: Target; regions: ExtractTextSettings[]; config?: Config}): Promise<string[]>
  close(options?: {throwErr: boolean}): Promise<TestResult[]>
  abort(): Promise<TestResult[]>
}

export interface Config {
  agentId?: string
  isDisabled?: boolean

  serverUrl?: string
  proxyUrl?: Proxy
  apiKey?: string
  connectionTimeout?: number
  removeSession?: boolean

  appName?: string
  testName?: string
  displayName?: string
  sessionType?: SessionType
  properties?: CustomProperty[]
  batch?: Batch
  environmentName?: string
  environment?: Environment
  baselineEnvName?: string
  branchName?: string
  parentBranchName?: string
  baselineBranchName?: string
  compareWithParentBranch?: boolean
  ignoreGitMergeBase?: boolean
  ignoreBaseline?: boolean
  saveFailedTests?: boolean
  saveNewTests?: boolean
  saveDiffs?: boolean
  dontCloseBatches?: boolean
}

type CodedRegion<TRegion = Region> = {region: TRegion; padding?: number | OffsetRect; regionId?: string}
type FloatingRegion<TRegion = Region> = CodedRegion<TRegion> & {offset: OffsetRect}
type AccessibilityRegion<TRegion = Region> = CodedRegion<TRegion> & {type: AccessibilityRegionType}

export interface CheckSettings<TRegion = Region> {
  name?: string
  pageId?: string
  ignoreRegions?: (TRegion | CodedRegion<TRegion>)[]
  layoutRegions?: (TRegion | CodedRegion<TRegion>)[]
  strictRegions?: (TRegion | CodedRegion<TRegion>)[]
  contentRegions?: (TRegion | CodedRegion<TRegion>)[]
  floatingRegions?: (TRegion | FloatingRegion<TRegion>)[]
  accessibilityRegions?: (TRegion | AccessibilityRegion<TRegion>)[]
  accessibilitySettings?: {level?: AccessibilityLevel; guidelinesVersion?: AccessibilityGuidelinesVersion}
  matchLevel?: MatchLevel
  sendDom?: boolean
  useDom?: boolean
  enablePatterns?: boolean
  ignoreCaret?: boolean
  ignoreDisplacements?: boolean
}

export interface LocateSettings<TLocator extends string> {
  locatorNames: TLocator[]
  firstOnly?: boolean
}

export interface LocateTextSettings<TPattern extends string> {
  patterns: TPattern[]
  ignoreCase?: boolean
  firstOnly?: boolean
  language?: string
}

export interface ExtractTextSettings {
  hint?: string
  minMatch?: number
  language?: string
}

export interface CloseBatchesSettings {
  batchIds: string[]
  serverUrl?: string
  proxyUrl?: string
  apiKey?: string
}

export interface DeleteTestSettings {
  testId: string
  batchId: string
  secretToken: string
  serverUrl?: string
  proxyUrl?: string
  apiKey?: string
}

export interface EyesError extends Error {
  reason: string
  info: Record<string, any>
  original: Error
}

import {MaybeArray} from './types'
import {
  Region,
  TextRegion,
  Batch,
  CustomProperty,
  SessionType,
  Proxy,
  MatchLevel,
  AccessibilityLevel,
  AccessibilityGuidelinesVersion,
  OffsetRect,
  AccessibilityRegionType,
  TestResultsStatus,
  AccessibilityStatus,
  Size,
  Location,
  ImageCropRect,
  ImageCropRegion,
  ImageRotation,
} from './data'

import {Logger} from './debug'

export type Target = {
  image: Buffer | string
  name?: string
  source?: string
  dom?: string
  locationInViewport?: Location // location in the viewport
  locationInView?: Location // location in view/page
  fullViewSize?: Size // full size of the view/page
}

export interface Core<TEyes = Eyes> {
  openEyes(options: {settings: OpenSettings; logger?: Logger}): Promise<TEyes>
  getAccountInfo(options: {settings: ServerSettings; logger?: Logger}): Promise<AccountInfo>
  closeBatch(options: {settings: MaybeArray<CloseBatchSettings>; logger?: Logger}): Promise<void>
  deleteTest(options: {settings: MaybeArray<DeleteTestSettings>; logger?: Logger}): Promise<void>
}

export interface Eyes<TTarget = Target> {
  readonly test: TestInfo
  check(options: {target: TTarget; settings?: CheckSettings; logger?: Logger}): Promise<CheckResult[]>
  checkAndClose(options: {
    target: TTarget
    settings?: CheckSettings & CloseSettings
    logger?: Logger
  }): Promise<TestResult[]>
  locate?<TLocator extends string>(options: {
    target: TTarget
    settings: LocateSettings<TLocator>
    logger?: Logger
  }): Promise<Record<TLocator, Region[]>>
  locateText?<TPattern extends string>(options: {
    target: TTarget
    settings: LocateTextSettings<TPattern>
    logger?: Logger
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText?(options: {
    target: TTarget
    settings: MaybeArray<ExtractTextSettings>
    logger?: Logger
  }): Promise<string[]>
  close(options?: {settings?: CloseSettings; logger?: Logger}): Promise<TestResult[]>
  abort(options?: {logger?: Logger}): Promise<TestResult[]>
}

type Environment = {
  os?: string
  osInfo?: string
  hostingApp?: string
  hostingAppInfo?: string
  deviceName?: string
  viewportSize?: Size
  userAgent?: string
  rawEnvironment?: Record<string, any>
}

export interface ServerSettings {
  serverUrl: string
  apiKey: string
  proxy?: Proxy
  agentId?: string
}

export interface OpenSettings extends ServerSettings {
  appName: string
  testName: string
  displayName?: string
  agentRunId?: string
  sessionType?: SessionType
  properties?: CustomProperty[]
  batch?: Batch
  dontCloseBatches?: boolean
  environmentName?: string
  environment?: Environment
  baselineEnvName?: string
  branchName?: string
  parentBranchName?: string
  baselineBranchName?: string
  compareWithParentBranch?: boolean
  gitBranchingTimestamp?: string
  ignoreGitBranching?: boolean
  ignoreBaseline?: boolean
  saveDiffs?: boolean
  abortIdleTestTimeout?: number
  connectionTimeout?: number
  removeSession?: boolean
  isDisabled?: boolean
}

type CodedRegion<TRegion = Region> = {region: TRegion; padding?: number | OffsetRect; regionId?: string}
type FloatingRegion<TRegion = Region> = CodedRegion<TRegion> & {offset: OffsetRect}
type AccessibilityRegion<TRegion = Region> = CodedRegion<TRegion> & {type: AccessibilityRegionType}

export interface ImageSettings<TRegion = Region> {
  region?: TRegion
  normalization?: {
    cut?: ImageCropRect | ImageCropRegion
    rotation?: ImageRotation
    scaleRatio?: number
  }
  debugImages?: {path: string; prefix?: string}
}

export interface CheckSettings<TRegion = Region> extends ImageSettings<TRegion> {
  name?: string
  pageId?: string
  renderId?: string
  variationGroupId?: string
  ignoreRegions?: (TRegion | CodedRegion<TRegion>)[]
  layoutRegions?: (TRegion | CodedRegion<TRegion>)[]
  strictRegions?: (TRegion | CodedRegion<TRegion>)[]
  contentRegions?: (TRegion | CodedRegion<TRegion>)[]
  floatingRegions?: (TRegion | FloatingRegion<TRegion>)[]
  accessibilityRegions?: (TRegion | AccessibilityRegion<TRegion>)[]
  accessibilitySettings?: {level?: AccessibilityLevel; version?: AccessibilityGuidelinesVersion}
  matchLevel?: MatchLevel
  sendDom?: boolean
  useDom?: boolean
  enablePatterns?: boolean
  ignoreCaret?: boolean
  ignoreDisplacements?: boolean
  ignoreMismatch?: boolean
  ignoreMatch?: boolean
  forceMismatch?: boolean
  forceMatch?: boolean
}

export interface LocateSettings<TLocator extends string, TRegion = Region> extends ImageSettings<TRegion> {
  appName: string
  locatorNames: TLocator[]
  firstOnly?: boolean
}

export interface LocateTextSettings<TPattern extends string, TRegion = Region> extends ImageSettings<TRegion> {
  patterns: TPattern[]
  ignoreCase?: boolean
  firstOnly?: boolean
  language?: string
}

export interface ExtractTextSettings<TRegion = Region> extends ImageSettings<TRegion> {
  hint?: string
  minMatch?: number
  language?: string
}

export interface CloseSettings {
  updateBaselineIfNew?: boolean
  updateBaselineIfDifferent?: boolean
}

export interface CloseBatchSettings extends ServerSettings {
  batchId: string
}

export interface DeleteTestSettings extends ServerSettings {
  testId: string
  batchId: string
  secretToken: string
}

export interface TestInfo {
  testId: string
  batchId: string
  baselineId: string
  sessionId: string
  resultsUrl: string
  isNew: boolean
  server: ServerSettings
  account: AccountInfo
}

export interface AccountInfo {
  ufg: {
    serverUrl: string // serviceUrl
    accessToken: string // accessToken
  }
  stitchingServiceUrl: string
  uploadUrl: string // resultsUrl
  maxImageHeight: number
  maxImageArea: number
}

export interface CheckResult {
  readonly asExpected: boolean
  readonly windowId: number
}

type StepInfo = {
  readonly name?: string
  readonly isDifferent?: boolean
  readonly hasBaselineImage?: boolean
  readonly hasCurrentImage?: boolean
  readonly appUrls?: AppUrls
  readonly apiUrls?: ApiUrls
  readonly renderId?: string[]
}
type ApiUrls = {
  readonly baselineImage?: string
  readonly currentImage?: string
  readonly checkpointImage?: string
  readonly checkpointImageThumbnail?: string
  readonly diffImage?: string
}
type AppUrls = {
  readonly step?: string
  readonly stepEditor?: string
}
type SessionUrls = {
  readonly batch?: string
  readonly session?: string
}
export interface TestResult {
  readonly id?: string
  readonly name?: string
  readonly secretToken?: string
  readonly status?: TestResultsStatus
  readonly appName?: string
  readonly batchId?: string
  readonly batchName?: string
  readonly branchName?: string
  readonly hostOS?: string
  readonly hostApp?: string
  readonly hostDisplaySize?: Size
  readonly accessibilityStatus?: {
    readonly level: AccessibilityLevel
    readonly version: AccessibilityGuidelinesVersion
    readonly status: AccessibilityStatus
  }
  readonly startedAt?: Date | string
  readonly duration?: number
  readonly isNew?: boolean
  readonly isDifferent?: boolean
  readonly isAborted?: boolean
  readonly appUrls?: SessionUrls
  readonly apiUrls?: SessionUrls
  readonly stepsInfo?: StepInfo[]
  readonly steps?: number
  readonly matches?: number
  readonly mismatches?: number
  readonly missing?: number
  readonly exactMatches?: number
  readonly strictMatches?: number
  readonly contentMatches?: number
  readonly layoutMatches?: number
  readonly noneMatches?: number
  readonly url?: string
}

export interface EyesError extends Error {
  reason: string
  info: Record<string, any>
  original: Error
}

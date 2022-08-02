import type {Region, TextRegion, Size, Mutable} from '@applitools/types'
import type {
  Target,
  Core,
  Eyes,
  ServerSettings,
  CheckSettings,
  LocateSettings,
  LocateTextSettings,
  ExtractTextSettings,
  CloseSettings,
  DeleteTestSettings,
  CloseBatchSettings,
  CheckResult,
  TestResult,
  OpenSettings,
} from '@applitools/types/types/core-base'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeReqEyes, type ReqEyes} from './req-eyes'
import {makeUpload, type Upload} from './upload'
import * as utils from '@applitools/utils'

interface Account {
  renderUrl: string // serviceUrl
  renderToken: string // accessToken
  uploadUrl: string // resultsUrl
  maxImageHeight: number
  maxImageArea: number
}

interface Test {
  testId: string
  batchId: string
  baselineId: string
  sessionId: string
  resultsUrl: string
  isNew: boolean
  account: Account
}

export interface CoreRequests extends Core {
  openEyes(options: {settings: OpenSettings}): Promise<EyesRequests>
  getAccountInfo(options: {settings: ServerSettings}): Promise<Account>
  getBatchBranches(options: {
    settings: ServerSettings & {batchId: string}
  }): Promise<{branchName: string; parentBranchName: string}>
  closeBatch(options: {settings: CloseBatchSettings}): Promise<void>
  deleteTest(options: {settings: DeleteTestSettings}): Promise<void>
}

export interface EyesRequests extends Eyes {
  check(options: {target: Target; settings?: CheckSettings}): Promise<CheckResult[]>
  checkAndClose(options: {target: Target; settings?: CheckSettings}): Promise<TestResult[]>
  locate<TLocator extends string>(options: {
    target: Target
    settings: LocateSettings<TLocator>
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target: Target
    settings: LocateTextSettings<TPattern>
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {target: Target; settings: ExtractTextSettings}): Promise<string[]>
  close(options?: {settings?: Omit<CloseSettings, 'throwErr'>}): Promise<TestResult[]>
  abort(): Promise<TestResult[]>
}

export function makeCoreRequests({agentId, logger}: {agentId: string; logger?: Logger}): CoreRequests {
  logger ??= makeLogger()

  const getAccountInfoWithCache = utils.general.cachify(getAccountInfo)
  const getBatchBranchesWithCache = utils.general.cachify(getBatchBranches)

  return {
    getAccountInfo: getAccountInfoWithCache,
    getBatchBranches: getBatchBranchesWithCache,
    openEyes,
    closeBatch,
    deleteTest,
  }

  async function openEyes({settings}: {settings: OpenSettings}): Promise<EyesRequests> {
    settings.agentId = `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "openEyes" called with settings', settings)

    const accountPromise = getAccountInfoWithCache({settings})

    const response = await req('/api/sessions/running', {
      name: 'openEyes',
      method: 'POST',
      body: {
        startInfo: {
          agentId: `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim(),
          agentSessionId: utils.general.guid(),
          agentRunId: settings.agentRunId,
          sessionType: settings.sessionType,
          appIdOrName: settings.appName,
          scenarioIdOrName: settings.testName,
          displayName: settings.displayName,
          batchInfo: settings.batch && {
            id: settings.batch.id,
            name: settings.batch.name,
            batchSequenceName: settings.batch.sequenceName,
            startedAt: settings.batch.startedAt,
            notifyOnCompletion: settings.batch.notifyOnCompletion,
            properties: settings.batch.properties,
          },
          baselineEnvName: settings.baselineEnvName,
          environmentName: settings.environmentName,
          environment: settings.environment && {
            os: settings.environment.os,
            osInfo: settings.environment.osInfo,
            hostingApp: settings.environment.hostingApp,
            hostingAppInfo: settings.environment.hostingAppInfo,
            deviceInfo: settings.environment.deviceName,
            displaySize: settings.environment.viewportSize,
            inferred: settings.environment.userAgent,
          },
          branchName: settings.branchName,
          parentBranchName: settings.parentBranchName,
          baselineBranchName: settings.baselineBranchName,
          compareWithParentBranch: settings.compareWithParentBranch,
          parentBranchBaselineSavedBefore: settings.gitBranchingTimestamp,
          ignoreBaseline: settings.ignoreBaseline,
          saveDiffs: settings.saveDiffs,
          properties: settings.properties,
          timeout: settings.abortIdleTestTimeout,
        },
      },
      expected: [200, 201],
    })
    const test: Test = await response.json().then(async result => {
      const test: any = {
        testId: result.id,
        batchId: result.batchId,
        baselineId: result.baselineId,
        sessionId: result.sessionId,
        resultsUrl: result.url,
        isNew: result.isNew ?? response.status === 201,
      }
      if (result.renderingInfo) {
        const {serviceUrl, accessToken, resultsUrl, ...rest} = result.renderingInfo
        test.account = {renderUrl: serviceUrl, renderToken: accessToken, uploadUrl: resultsUrl, ...rest}
      } else {
        test.account = await accountPromise
      }
      return test
    })
    logger.log('Request "openEyes" finished successfully with body', test)

    const upload = makeUpload({config: {uploadUrl: test.account.uploadUrl}, logger})

    return makeEyesCommands({test, req, upload, logger})
  }

  async function getAccountInfo({settings}: {settings: ServerSettings}): Promise<Account> {
    settings.agentId = `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "getAccountInfo" called with settings', settings)
    const response = await req('/api/sessions/renderinfo', {
      name: 'getAccountInfo',
      method: 'GET',
      expected: 200,
    })
    const result = await response.json().then(result => {
      const {serviceUrl, accessToken, resultsUrl, ...rest} = result
      return {renderUrl: serviceUrl, renderToken: accessToken, uploadUrl: resultsUrl, ...rest}
    })
    logger.log('Request "getAccountInfo" finished successfully with body', result)
    return result
  }

  async function getBatchBranches({
    settings,
  }: {
    settings: ServerSettings & {batchId: string}
  }): Promise<{branchName: string; parentBranchName: string}> {
    settings.agentId = `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "getBatchBranches" called with settings', settings)
    const response = await req(`/api/sessions/batches/${settings.batchId}/config/bypointerId`, {
      name: 'getBatchBranches',
      method: 'GET',
      expected: 200,
    })
    const result = await response.json().then(result => {
      return {branchName: result.scmSourceBranch, parentBranchName: result.scmTargetBranch}
    })
    logger.log('Request "getBatchBranches" finished successfully with body', result)
    return result
  }

  async function closeBatch({settings}: {settings: CloseBatchSettings}) {
    settings.agentId = `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "closeBatch" called with settings', settings)
    await req(`/api/sessions/batches/${settings.batchId}/close/bypointerId`, {
      name: 'closeBatch',
      method: 'DELETE',
      expected: 200,
    })
    logger.log('Request "closeBatch" finished successfully')
  }

  async function deleteTest({settings}: {settings: DeleteTestSettings}) {
    settings.agentId = `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "deleteTest" called with settings', settings)
    await req(`/api/sessions/batches/${settings.batchId}/${settings.testId}`, {
      name: 'deleteTest',
      method: 'DELETE',
      query: {
        accessToken: settings.secretToken,
      },
      expected: 200,
    })
    logger.log('Request "deleteTest" finished successfully')
  }
}

export function makeEyesCommands({
  test,
  req,
  upload,
  logger,
}: {
  test: Test
  req: ReqEyes
  upload: Upload
  logger?: Logger
}): EyesRequests {
  let supportsCheckAndClose = true

  return {check, checkAndClose, locate, locateText, extractText, close, abort}

  async function check({
    target,
    settings,
  }: {
    target: Target
    settings: CheckSettings & {
      source?: string
      ignoreMismatch?: boolean
      ignoreMatch?: boolean
      forceMismatch?: boolean
      forceMatch?: boolean
    }
  }): Promise<CheckResult[]> {
    logger.log('Request "locate" called for target', target, 'with settings', settings)
    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image}),
      upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'check',
      method: 'POST',
      body: {
        appOutput: {
          title: target.name,
          screenshotUrl: target.image,
          domUrl: target.dom,
          imageLocation: target.location,
          pageCoverageInfo: target.coverage && {
            pageId: settings.pageId,
            width: target.coverage.size.width,
            height: target.coverage.size.height,
            imagePositionInPage: target.coverage.location,
          },
        },
        options: {
          imageMatchSettings: {
            ignore: transformRegions(settings.ignoreRegions),
            layout: transformRegions(settings.layoutRegions),
            strict: transformRegions(settings.strictRegions),
            content: transformRegions(settings.contentRegions),
            floating: transformRegions(settings.floatingRegions),
            accessibility: transformRegions(settings.accessibilityRegions),
            accessibilitySettings: settings.accessibilitySettings,
            ignoreDisplacements: settings.ignoreDisplacements,
            ignoreCaret: settings.ignoreCaret,
            enablePatterns: settings.enablePatterns,
            matchLevel: settings.matchLevel,
            useDom: settings.useDom,
          },
          name: settings.name,
          source: settings.source,
          renderId: settings.renderId,
          variantId: settings.variationGroupId,
          ignoreMismatch: settings.ignoreMismatch,
          ignoreMatch: settings.ignoreMatch,
          forceMismatch: settings.forceMismatch,
          forceMatch: settings.forceMatch,
        },
      },
      expected: 200,
    })
    const result: CheckResult = await response.json()
    logger.log('Request "check" finished successfully with body', result)
    return [result]
  }

  async function checkAndClose({
    target,
    settings,
  }: {
    target: Target
    settings: CheckSettings & {
      source?: string
      renderId?: string
      variantGroupId?: string
      ignoreMismatch?: boolean
      ignoreMatch?: boolean
      forceMismatch?: boolean
      forceMatch?: boolean
      updateBaseLineIfNew?: boolean
      updateBaselineIfDifferent?: boolean
    }
  }): Promise<TestResult[]> {
    if (!supportsCheckAndClose) {
      logger.log('Request "checkAndClose" is notSupported by the server, using "check" and "close" requests instead')
      await check({target, settings})
      return close({settings})
    }
    logger.log('Request "checkAndClose" called for target', target, 'with settings', settings)
    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image}),
      upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}/matchandend`, {
      name: 'checkAndClose',
      method: 'POST',
      body: {
        appOutput: {
          title: target.name,
          screenshotUrl: target.image,
          domUrl: target.dom,
          imageLocation: target.location,
          pageCoverageInfo: target.coverage
            ? {
                pageId: settings.pageId,
                width: target.coverage.size.width,
                height: target.coverage.size.height,
                imagePositionInPage: target.coverage.location,
              }
            : undefined,
        },
        options: {
          imageMatchSettings: {
            ignore: settings.ignoreRegions,
            layout: settings.layoutRegions,
            strict: settings.strictRegions,
            content: settings.contentRegions,
            floating: settings.floatingRegions,
            accessibility: settings.accessibilityRegions,
            accessibilitySettings: settings.accessibilitySettings,
            ignoreDisplacements: settings.ignoreDisplacements,
            ignoreCaret: settings.ignoreCaret,
            enablePatterns: settings.enablePatterns,
            matchLevel: settings.matchLevel,
            useDom: settings.useDom,
          },
          name: settings.name,
          source: settings.source,
          renderId: settings.renderId,
          variantId: settings.variantGroupId,
          ignoreMismatch: settings.ignoreMismatch,
          ignoreMatch: settings.ignoreMatch,
          forceMismatch: settings.forceMismatch,
          forceMatch: settings.forceMatch,
          removeSession: false,
          removeSessionIfMatching: settings.ignoreMismatch,
          updateBaselineIfNew: settings.updateBaseLineIfNew,
          updateBaselineIfDifferent: settings.updateBaselineIfDifferent,
        },
      },
      hooks: {
        beforeRetry({response}) {
          if (response.status === 404) return req.stop
        },
      },
      expected: 200,
    })
    if (response.status === 404) {
      supportsCheckAndClose = false
      return checkAndClose({target, settings})
    }
    const result: TestResult = await response.json()
    logger.log('Request "checkAndClose" finished successfully with body', result)
    return [result]
  }

  async function locate<TLocator extends string>({
    target,
    settings,
  }: {
    target: Target
    settings: LocateSettings<TLocator>
  }): Promise<Record<TLocator, Region[]>> {
    logger.log('Request "locate" called for target', target, 'with settings', settings)
    target.image = await upload({name: 'image', resource: target.image})
    const response = await req('/api/locators/locate', {
      name: 'locate',
      method: 'POST',
      body: {
        imageUrl: target.image,
        appName: settings.appName,
        locatorNames: settings.locatorNames,
        firstOnly: settings.firstOnly,
      },
      expected: 200,
    })
    const result = await response.json()
    logger.log('Request "locate" finished successfully with body', result)
    return result
  }

  async function locateText<TPattern extends string>({
    target,
    settings,
  }: {
    target: Target
    settings: LocateTextSettings<TPattern>
  }): Promise<Record<TPattern, TextRegion[]>> {
    logger.log('Request "locateText" called for target', target, 'with settings', settings)
    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image}),
      upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const response = await req('/api/sessions/running/images/textregions', {
      name: 'locateText',
      body: {
        appOutput: {
          screenshotUrl: target.image,
          domUrl: target.dom,
          location: target.location,
        },
        patterns: settings.patterns,
        ignoreCase: settings.ignoreCase,
        firstOnly: settings.firstOnly,
        language: settings.language,
      },
      expected: 200,
    })
    const result = await response.json()
    logger.log('Request "locateText" finished successfully with body', result)
    return result
  }

  async function extractText({
    target,
    settings,
  }: {
    target: Target
    settings: ExtractTextSettings & {size: Size}
  }): Promise<string[]> {
    logger.log('Request "extractText" called for target', target, 'with settings', settings)
    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image}),
      upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const response = await req('/api/sessions/running/images/text', {
      name: 'extractText',
      method: 'POST',
      body: {
        appOutput: {
          screenshotUrl: target.image,
          domUrl: target.dom,
          location: target.location,
        },
        regions: [{x: 0, y: 0, ...settings.size}],
        minMatch: settings.minMatch,
        language: settings.language,
      },
      expected: 200,
    })
    const result = await response.json()
    logger.log('Request "extractText" finished successfully with body', result)
    return result
  }

  async function close({settings}: {settings?: Omit<CloseSettings, 'throwErr'>} = {}): Promise<TestResult[]> {
    logger.log(`Request "close" called for test ${test.testId} with settings`, settings)
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'close',
      method: 'DELETE',
      query: {
        aborted: false,
        updateBaseline: test.isNew ? settings?.updateBaselineIfNew : settings?.updateBaselineIfDifferent,
      },
      expected: 200,
    })
    const result: Mutable<TestResult> = await response.json()
    result.url = test.resultsUrl
    result.isNew = test.isNew
    // for backwards compatibility with outdated servers
    result.status ??= result.missing === 0 && result.mismatches === 0 ? 'Passed' : 'Unresolved'
    logger.log('Request "close" finished successfully with body', result)
    return [result]
  }

  async function abort(): Promise<TestResult[]> {
    logger.log(`Request "abort" called for test ${test.testId}`)
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'abort',
      method: 'DELETE',
      query: {
        aborted: true,
      },
      expected: 200,
    })
    const result: TestResult = await response.json()
    logger.log('Request "abort" finished successfully with body', result)
    return [result]
  }
}

function transformRegions(
  regions: CheckSettings[`${'ignore' | 'layout' | 'content' | 'strict' | 'floating' | 'accessibility'}Regions`][number][],
) {
  return regions?.map(region => {
    const options = {} as any
    if (utils.types.has(region, 'region')) {
      options.regionId = region.regionId
      if (utils.types.has(region, 'type')) {
        options.type = region.type
      }
      if (utils.types.has(region, 'offset')) {
        options.maxUpOffset = region.offset.top
        options.maxDownOffset = region.offset.bottom
        options.maxLeftOffset = region.offset.left
        options.maxRightOffset = region.offset.right
      }
      region = utils.geometry.padding(region.region, region.padding)
    }
    return {left: region.x, top: region.y, width: region.width, height: region.height, ...options}
  })
}

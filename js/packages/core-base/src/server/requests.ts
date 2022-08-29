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
  TestInfo,
  AccountInfo,
  CheckResult,
  TestResult,
  OpenSettings,
} from '@applitools/types/base'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeReqEyes, type ReqEyes} from './req-eyes'
import {makeUpload, type Upload} from './upload'
import * as utils from '@applitools/utils'

export interface CoreRequests extends Core {
  openEyes(options: {settings: OpenSettings; logger?: Logger}): Promise<EyesRequests>
  getAccountInfo(options: {settings: ServerSettings; logger?: Logger}): Promise<AccountInfo>
  getBatchBranches(options: {
    settings: ServerSettings & {batchId: string}
    logger?: Logger
  }): Promise<{branchName: string; parentBranchName: string}>
  closeBatch(options: {settings: CloseBatchSettings; logger?: Logger}): Promise<void>
  deleteTest(options: {settings: DeleteTestSettings; logger?: Logger}): Promise<void>
}

export interface EyesRequests extends Eyes {
  readonly test: TestInfo
  check(options: {target: Target; settings?: CheckSettings; logger?: Logger}): Promise<CheckResult[]>
  checkAndClose(options: {target: Target; settings?: CheckSettings; logger?: Logger}): Promise<TestResult[]>
  locate<TLocator extends string>(options: {
    target: Target
    settings: LocateSettings<TLocator>
    logger?: Logger
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    target: Target
    settings: LocateTextSettings<TPattern>
    logger?: Logger
  }): Promise<Record<TPattern, TextRegion[]>>
  extractText(options: {target: Target; settings: ExtractTextSettings; logger?: Logger}): Promise<string[]>
  close(options?: {settings?: CloseSettings; logger?: Logger}): Promise<TestResult[]>
  abort(options?: {logger?: Logger}): Promise<TestResult[]>
}

export function makeCoreRequests({agentId, logger: defaultLogger}: {agentId: string; logger?: Logger}): CoreRequests {
  defaultLogger ??= makeLogger()

  const getAccountInfoWithCache = utils.general.cachify(getAccountInfo)
  const getBatchBranchesWithCache = utils.general.cachify(getBatchBranches)

  return {
    getAccountInfo: getAccountInfoWithCache,
    getBatchBranches: getBatchBranchesWithCache,
    openEyes,
    closeBatch,
    deleteTest,
  }

  async function openEyes({settings, logger = defaultLogger}: {settings: OpenSettings; logger?: Logger}): Promise<EyesRequests> {
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
          environment:
            settings.environment &&
            (settings.environment.rawEnvironment ?? {
              os: settings.environment.os,
              osInfo: settings.environment.osInfo,
              hostingApp: settings.environment.hostingApp,
              hostingAppInfo: settings.environment.hostingAppInfo,
              deviceInfo: settings.environment.deviceName,
              displaySize: utils.geometry.round(settings.environment.viewportSize),
              inferred: settings.environment.userAgent && `useragent:${settings.environment.userAgent}`,
            }),
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
      logger,
    })
    const test: TestInfo = await response.json().then(async result => {
      const test: TestInfo = {
        testId: result.id,
        batchId: result.batchId,
        baselineId: result.baselineId,
        sessionId: result.sessionId,
        resultsUrl: result.url,
        isNew: result.isNew ?? response.status === 201,
        server: {serverUrl: settings.serverUrl, apiKey: settings.apiKey, proxy: settings.proxy},
        account: null,
      }
      if (result.renderingInfo) {
        const {serviceUrl, accessToken, resultsUrl, ...rest} = result.renderingInfo
        test.account = {ufg: {serverUrl: serviceUrl, accessToken}, uploadUrl: resultsUrl, ...rest}
      } else {
        test.account = await accountPromise
      }
      return test
    })
    logger.log('Request "openEyes" finished successfully with body', test)

    const upload = makeUpload({config: {uploadUrl: test.account.uploadUrl}, logger})

    return makeEyesCommands({test, req, upload, logger})
  }

  async function getAccountInfo({
    settings,
    logger = defaultLogger,
  }: {
    settings: ServerSettings
    logger?: Logger
  }): Promise<AccountInfo> {
    settings.agentId = `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "getAccountInfo" called with settings', settings)
    const response = await req('/api/sessions/renderinfo', {
      name: 'getAccountInfo',
      method: 'GET',
      expected: 200,
      logger,
    })
    const result = await response.json().then(result => {
      const {serviceUrl, accessToken, resultsUrl, ...rest} = result
      return {ufg: {serverUrl: serviceUrl, accessToken}, uploadUrl: resultsUrl, ...rest}
    })
    logger.log('Request "getAccountInfo" finished successfully with body', result)
    return result
  }

  async function getBatchBranches({
    settings,
    logger = defaultLogger,
  }: {
    settings: ServerSettings & {batchId: string}
    logger?: Logger
  }): Promise<{branchName: string; parentBranchName: string}> {
    settings.agentId = `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "getBatchBranches" called with settings', settings)
    const response = await req(`/api/sessions/batches/${settings.batchId}/config/bypointerId`, {
      name: 'getBatchBranches',
      method: 'GET',
      expected: 200,
      logger,
    })
    const result = await response.json().then(result => {
      return {branchName: result.scmSourceBranch, parentBranchName: result.scmTargetBranch}
    })
    logger.log('Request "getBatchBranches" finished successfully with body', result)
    return result
  }

  async function closeBatch({settings, logger = defaultLogger}: {settings: CloseBatchSettings; logger?: Logger}) {
    settings.agentId = `${agentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "closeBatch" called with settings', settings)
    await req(`/api/sessions/batches/${settings.batchId}/close/bypointerId`, {
      name: 'closeBatch',
      method: 'DELETE',
      expected: 200,
      logger,
    })
    logger.log('Request "closeBatch" finished successfully')
  }

  async function deleteTest({settings, logger = defaultLogger}: {settings: DeleteTestSettings; logger?: Logger}) {
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
      logger,
    })
    logger.log('Request "deleteTest" finished successfully')
  }
}

export function makeEyesCommands({
  test,
  req,
  upload,
  logger: defaultLogger,
}: {
  test: TestInfo
  req: ReqEyes
  upload: Upload
  logger?: Logger
}): EyesRequests {
  let supportsCheckAndClose = true

  return {test, check, checkAndClose, locate, locateText, extractText, close, abort}

  async function check({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: Target
    settings: CheckSettings
    logger?: Logger
  }): Promise<CheckResult[]> {
    logger.log('Request "check" called for target', target, 'with settings', settings)
    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image}),
      upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'check',
      method: 'POST',
      body: transformCheckOptions({target, settings}),
      expected: 200,
      logger,
    })
    const result: CheckResult = await response.json()
    logger.log('Request "check" finished successfully with body', result)
    return [result]
  }

  async function checkAndClose({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: Target
    settings: CheckSettings & CloseSettings
    logger?: Logger
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
    const matchOptions = transformCheckOptions({target, settings})
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}/matchandend`, {
      name: 'checkAndClose',
      method: 'POST',
      body: {
        ...matchOptions,
        options: {
          ...matchOptions.options,
          removeSession: false,
          removeSessionIfMatching: settings.ignoreMismatch,
          updateBaselineIfNew: settings.updateBaselineIfNew,
          updateBaselineIfDifferent: settings.updateBaselineIfDifferent,
        },
      },
      hooks: {
        beforeRetry({response, stop}) {
          if (response.status === 404) return stop
        },
      },
      expected: 200,
      logger,
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
    logger = defaultLogger,
  }: {
    target: Target
    settings: LocateSettings<TLocator>
    logger?: Logger
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
      logger,
    })
    const result = await response.json()
    logger.log('Request "locate" finished successfully with body', result)
    return result
  }

  async function locateText<TPattern extends string>({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: Target
    settings: LocateTextSettings<TPattern>
    logger?: Logger
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
          location: target.locationInViewport,
        },
        patterns: settings.patterns,
        ignoreCase: settings.ignoreCase,
        firstOnly: settings.firstOnly,
        language: settings.language,
      },
      expected: 200,
      logger,
    })
    const result = await response.json()
    logger.log('Request "locateText" finished successfully with body', result)
    return result
  }

  async function extractText({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: Target
    settings: ExtractTextSettings & {size: Size}
    logger?: Logger
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
          location: target.locationInViewport,
        },
        regions: [{x: 0, y: 0, ...settings.size, expected: settings.hint}],
        minMatch: settings.minMatch,
        language: settings.language,
      },
      expected: 200,
      logger,
    })
    const result = await response.json()
    logger.log('Request "extractText" finished successfully with body', result)
    return result
  }

  async function close({settings, logger = defaultLogger}: {settings?: CloseSettings; logger?: Logger} = {}): Promise<
    TestResult[]
  > {
    logger.log(`Request "close" called for test ${test.testId} with settings`, settings)
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'close',
      method: 'DELETE',
      query: {
        aborted: false,
        updateBaseline: test.isNew ? settings?.updateBaselineIfNew : settings?.updateBaselineIfDifferent,
      },
      expected: 200,
      logger,
    })
    const result: Mutable<TestResult> = await response.json()
    result.url = test.resultsUrl
    result.isNew = test.isNew
    // for backwards compatibility with outdated servers
    result.status ??= result.missing === 0 && result.mismatches === 0 ? 'Passed' : 'Unresolved'
    logger.log('Request "close" finished successfully with body', result)
    return [result]
  }

  async function abort({logger = defaultLogger}: {logger?: Logger} = {}): Promise<TestResult[]> {
    logger.log(`Request "abort" called for test ${test.testId}`)
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'abort',
      method: 'DELETE',
      query: {
        aborted: true,
      },
      expected: 200,
      logger,
    })
    const result: TestResult = await response.json()
    logger.log('Request "abort" finished successfully with body', result)
    return [result]
  }
}

function transformCheckOptions({target, settings}: {target: Target; settings: CheckSettings}) {
  return {
    appOutput: {
      title: target.name,
      screenshotUrl: target.image,
      domUrl: target.dom,
      imageLocation: target.locationInViewport,
      pageCoverageInfo: settings.pageId && {
        pageId: settings.pageId,
        width: target.fullViewSize.width,
        height: target.fullViewSize.height,
        imagePositionInPage: target.locationInView,
      },
    },
    options: {
      imageMatchSettings: {
        ignore: transformRegions({regions: settings.ignoreRegions}),
        layout: transformRegions({regions: settings.layoutRegions}),
        strict: transformRegions({regions: settings.strictRegions}),
        content: transformRegions({regions: settings.contentRegions}),
        floating: transformRegions({regions: settings.floatingRegions}),
        accessibility: transformRegions({regions: settings.accessibilityRegions}),
        accessibilitySettings: settings.accessibilitySettings,
        ignoreDisplacements: settings.ignoreDisplacements,
        ignoreCaret: settings.ignoreCaret,
        enablePatterns: settings.enablePatterns,
        matchLevel: settings.matchLevel,
        useDom: settings.useDom,
      },
      name: settings.name,
      source: target.source,
      renderId: settings.renderId,
      variantId: settings.variationGroupId,
      ignoreMismatch: settings.ignoreMismatch,
      ignoreMatch: settings.ignoreMatch,
      forceMismatch: settings.forceMismatch,
      forceMatch: settings.forceMatch,
    },
  }
}

function transformRegions({
  regions,
}: {
  regions: CheckSettings[`${'ignore' | 'layout' | 'content' | 'strict' | 'floating' | 'accessibility'}Regions`][number][]
}) {
  return regions
    ?.map(region => {
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
        region = utils.geometry.round(utils.geometry.padding(region.region, region.padding))
      }
      return {left: region.x, top: region.y, width: region.width, height: region.height, ...options}
    })
    .sort((region1, region2) => {
      if (region1.top !== region2.top) return region1.top > region2.top ? 1 : -1
      else if (region1.left !== region2.left) return region1.left > region2.left ? 1 : -1
      else return 0
    })
    .reduce(transformDuplicatedRegionIds(), [])

  function transformDuplicatedRegionIds() {
    const stats = {} as Record<string, {firstIndex: number; count: number}>
    return (regions, region, index) => {
      if (!region.regionId) return regions.concat(region)
      if (!stats[region.regionId]) {
        stats[region.regionId] = {firstIndex: index, count: 1}
        return regions.concat(region)
      }
      const stat = stats[region.regionId]
      if (stat.count === 1) {
        regions[stat.firstIndex] = {...regions[stat.firstIndex], regionId: `${region.regionId} (${stat.count})`}
      }
      stat.count += 1
      return regions.concat({...region, regionId: `${region.regionId} (${stat.count})`})
    }
  }
}

import type {MaybeArray, Region} from '@applitools/utils'
import type {
  ImageTarget,
  Core,
  Eyes,
  FunctionalSession,
  ServerSettings,
  OpenSettings,
  CheckSettings,
  LocateSettings,
  LocateTextSettings,
  ExtractTextSettings,
  AbortSettings,
  CloseSettings,
  ReportSettings,
  CloseBatchSettings,
  DeleteTestSettings,
  LogEventSettings,
  VisualTest,
  FunctionalTest,
  Account,
  LocateResult,
  CheckResult,
  LocateTextResult,
  TestResult,
  GetResultsSettings,
} from '../types'
import {type Fetch} from '@applitools/req'
import {makeLogger, type Logger} from '@applitools/logger'
import {makeReqEyes, type ReqEyes} from './req-eyes'
import {makeUpload, type Upload} from './upload'
import * as utils from '@applitools/utils'

export interface CoreRequests extends Core {
  openEyes(options: {settings: OpenSettings; logger?: Logger}): Promise<EyesRequests>
  openFunctionalSession(options: {settings: OpenSettings; logger?: Logger}): Promise<FunctionalSessionRequests>
  getBatchBranches(options: {
    settings: ServerSettings & {batchId: string}
    logger?: Logger
  }): Promise<{branchName?: string; parentBranchName?: string}>
}

export interface EyesRequests extends Eyes {
  readonly core: CoreRequests
  report(options: {settings?: ReportSettings; logger?: Logger}): Promise<void>
}

export interface FunctionalSessionRequests extends FunctionalSession {
  readonly core: CoreRequests
  report(options: {settings?: ReportSettings; logger?: Logger}): Promise<void>
}

export function makeCoreRequests({
  agentId: defaultAgentId,
  fetch,
  logger,
}: {
  agentId: string
  fetch?: Fetch
  logger?: Logger
}): CoreRequests {
  const defaultLogger = logger?.extend({label: 'core-requests'}) ?? makeLogger({label: 'core-requests'})

  const getAccountInfoWithCache = utils.general.cachify(getAccountInfo, ([{settings}]) => {
    return [settings.serverUrl, settings.apiKey]
  })
  const getBatchBranchesWithCache = utils.general.cachify(getBatchBranches, ([{settings}]) => {
    return [settings.batchId, settings.serverUrl, settings.apiKey]
  })

  const core = {
    getAccountInfo: getAccountInfoWithCache,
    getBatchBranches: getBatchBranchesWithCache,
    openEyes,
    openFunctionalSession,
    locate,
    locateText,
    extractText,
    closeBatch,
    deleteTest,
    logEvent,
  }

  return core

  async function openEyes({
    settings,
    logger = defaultLogger,
  }: {
    settings: OpenSettings
    logger?: Logger
  }): Promise<EyesRequests> {
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
    logger.log('Request "openEyes" called with settings', settings)

    const accountPromise = getAccountInfoWithCache({settings})

    const initializedAt = new Date().toISOString()
    const response = await req('/api/sessions/running', {
      name: 'openEyes',
      method: 'POST',
      body: {
        startInfo: {
          agentId,
          agentSessionId: settings.userTestId,
          agentRunId: settings.userTestId,
          sessionType: settings.sessionType,
          appIdOrName: settings.appName,
          scenarioIdOrName: settings.testName,
          displayName: settings.displayName,
          properties: settings.properties,
          batchInfo: settings.batch && {
            id: settings.batch.id,
            name: settings.batch.name,
            batchSequenceName: settings.batch.sequenceName,
            startedAt: settings.batch.startedAt,
            notifyOnCompletion: settings.batch.notifyOnCompletion,
            properties: settings.batch.properties,
          },
          egSessionId: settings.environment?.ecSessionId ?? null,
          environment:
            settings.environment &&
            (settings.environment.rawEnvironment ?? {
              os: settings.environment.os,
              osInfo: settings.environment.osInfo,
              hostingApp: settings.environment.hostingApp,
              hostingAppInfo: settings.environment.hostingAppInfo,
              deviceInfo: settings.environment.deviceName,
              displaySize: settings.environment.viewportSize && utils.geometry.round(settings.environment.viewportSize),
              inferred: settings.environment.userAgent && `useragent:${settings.environment.userAgent}`,
            }),
          environmentName: settings.environmentName,
          baselineEnvName: settings.baselineEnvName,
          branchName: settings.branchName,
          parentBranchName: settings.parentBranchName,
          baselineBranchName: settings.baselineBranchName,
          compareWithParentBranch: settings.compareWithParentBranch,
          parentBranchBaselineSavedBefore: settings.gitBranchingTimestamp,
          ignoreBaseline: settings.ignoreBaseline,
          saveDiffs: settings.saveDiffs,
          timeout: settings.abortIdleTestTimeout,
        },
      },
      expected: [200, 201],
      logger,
    })
    const test: VisualTest = await response.json().then(async (result: any) => {
      const test = {
        testId: result.id,
        userTestId: settings.userTestId!,
        batchId: settings.batch?.id ?? result.batchId,
        baselineId: result.baselineId,
        sessionId: result.sessionId,
        resultsUrl: result.url,
        initializedAt,
        appId: settings.appName,
        isNew: result.isNew ?? response.status === 201,
        keepBatchOpen: !!settings.keepBatchOpen,
        keepIfDuplicate: !!settings.baselineEnvName,
        rendererId: settings.environment?.rendererId,
        rendererUniqueId: settings.environment?.rendererUniqueId,
        rendererInfo: settings.environment?.rendererInfo,
      } as VisualTest
      if (result.renderingInfo) {
        const {serviceUrl, accessToken, resultsUrl, ...rest} = result.renderingInfo
        test.account = {server: {...settings, agentId}, uploadUrl: resultsUrl, ...rest} as Account
        test.account.ufgServer = {
          serverUrl: serviceUrl,
          uploadUrl: test.account.uploadUrl,
          stitchingServiceUrl: test.account.stitchingServiceUrl,
          accessToken,
          agentId: test.account.server.agentId,
          proxy: test.account.server.proxy,
        }
      } else {
        test.account = await accountPromise
      }
      test.server = test.account.server
      test.ufgServer = test.account.ufgServer
      return test
    })
    logger.log('Request "openEyes" finished successfully with body', test)

    const upload = makeUpload({config: {uploadUrl: test.account.uploadUrl, proxy: settings.proxy}, logger})

    return makeEyesRequests({core, test, req, upload, logger})
  }

  async function openFunctionalSession({
    settings,
    logger = defaultLogger,
  }: {
    settings: OpenSettings
    logger?: Logger
  }): Promise<FunctionalSessionRequests> {
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
    logger.log('Request "openFunctionalSession" called with settings', settings)

    const accountPromise = getAccountInfoWithCache({settings})

    const initializedAt = new Date().toISOString()
    const response = await req('/api/sessions/running', {
      name: 'openFunctionalSession',
      method: 'POST',
      body: {
        startInfo: {
          agentId,
          agentSessionId: settings.userTestId,
          agentRunId: settings.userTestId,
          sessionType: settings.sessionType,
          appIdOrName: settings.appName,
          scenarioIdOrName: settings.testName,
          displayName: settings.displayName,
          properties: settings.properties,
          batchInfo: settings.batch && {
            id: settings.batch.id,
            name: settings.batch.name,
            batchSequenceName: settings.batch.sequenceName,
            startedAt: settings.batch.startedAt,
            notifyOnCompletion: settings.batch.notifyOnCompletion,
            properties: settings.batch.properties,
          },
          egSessionId: settings.environment?.ecSessionId ?? null,
          environment:
            settings.environment &&
            (settings.environment.rawEnvironment ?? {
              os: settings.environment.os,
              osInfo: settings.environment.osInfo,
              hostingApp: settings.environment.hostingApp,
              hostingAppInfo: settings.environment.hostingAppInfo,
              deviceInfo: settings.environment.deviceName,
              displaySize: settings.environment.viewportSize && utils.geometry.round(settings.environment.viewportSize),
              inferred: settings.environment.userAgent && `useragent:${settings.environment.userAgent}`,
            }),
          timeout: settings.abortIdleTestTimeout,
          nonVisual: true,
        },
      },
      expected: [200, 201],
      logger,
    })
    const test: FunctionalTest = await response.json().then(async (result: any) => {
      const account = await accountPromise
      const test = {
        testId: result.id,
        userTestId: settings.userTestId!,
        batchId: settings.batch?.id ?? result.batchId,
        sessionId: result.sessionId,
        appId: settings.appName,
        resultsUrl: result.url,
        initializedAt,
        keepBatchOpen: !!settings.keepBatchOpen,
        server: account.server,
        account,
      } as FunctionalTest
      return test
    })
    logger.log('Request "openFunctionalSession" finished successfully with body', test)

    return makeFunctionalSessionRequests({core, test, req, logger})
  }

  async function locate<TLocator extends string>({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: ImageTarget
    settings: LocateSettings<TLocator>
    logger?: Logger
  }): Promise<LocateResult<TLocator>> {
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
    logger.log('Request "locate" called for target', target, 'with settings', settings)

    const account = await getAccountInfoWithCache({settings})
    const upload = makeUpload({config: {uploadUrl: account.uploadUrl, proxy: settings.proxy}, logger})

    target.image = await upload({name: 'image', resource: target.image as Buffer})
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
    const result = await response.json().then((results: any) => {
      return Object.entries<any[]>(results).reduce((results, [key, regions]) => {
        results[key as TLocator] =
          regions?.map(region => ({x: region.left, y: region.top, width: region.width, height: region.height})) ?? []
        return results
      }, {} as LocateResult<TLocator>)
    })
    logger.log('Request "locate" finished successfully with body', result)
    return result
  }

  async function locateText<TPattern extends string>({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: ImageTarget
    settings: LocateTextSettings<TPattern>
    logger?: Logger
  }): Promise<LocateTextResult<TPattern>> {
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
    logger.log('Request "locateText" called for target', target, 'with settings', settings)

    const account = await getAccountInfoWithCache({settings})
    const upload = makeUpload({config: {uploadUrl: account.uploadUrl, proxy: settings.proxy}, logger})

    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image as Buffer}),
      target.dom && upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const response = await req('/api/sessions/running/images/textregions', {
      name: 'locateText',
      method: 'POST',
      body: {
        appOutput: {
          screenshotUrl: target.image,
          domUrl: target.dom,
          location: target.locationInViewport && utils.geometry.round(target.locationInViewport),
        },
        patterns: settings.patterns,
        ignoreCase: settings.ignoreCase,
        firstOnly: settings.firstOnly,
        language: settings.language,
      },
      expected: 200,
      logger,
    })
    const result: any = await response.json()
    logger.log('Request "locateText" finished successfully with body', result)
    return result
  }

  async function extractText({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: ImageTarget
    settings: ExtractTextSettings
    logger?: Logger
  }): Promise<string[]> {
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
    logger.log('Request "extractText" called for target', target, 'with settings', settings)

    const account = await getAccountInfoWithCache({settings})
    const upload = makeUpload({config: {uploadUrl: account.uploadUrl, proxy: settings.proxy}, logger})

    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image as Buffer}),
      target.dom && upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const response = await req('/api/sessions/running/images/text', {
      name: 'extractText',
      method: 'POST',
      body: {
        appOutput: {
          screenshotUrl: target.image,
          domUrl: target.dom,
          location: target.locationInViewport && utils.geometry.round(target.locationInViewport),
        },
        regions: target.size && [{left: 0, top: 0, ...utils.geometry.round(target.size), expected: settings.hint}],
        minMatch: settings.minMatch,
        language: settings.language,
      },
      expected: 200,
      logger,
    })
    const result: any = await response.json()
    logger.log('Request "extractText" finished successfully with body', result)
    return result
  }

  async function getAccountInfo({
    settings,
    logger = defaultLogger,
  }: {
    settings: ServerSettings
    logger?: Logger
  }): Promise<Account> {
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
    logger.log('Request "getAccountInfo" called with settings', settings)
    const response = await req('/api/sessions/renderinfo', {
      name: 'getAccountInfo',
      method: 'GET',
      expected: 200,
      logger,
    })
    const result = await response.json().then((result: any) => {
      const {serviceUrl, accessToken, resultsUrl, ...rest} = result
      const account = {
        server: {serverUrl: settings.serverUrl, apiKey: settings.apiKey, proxy: settings.proxy, agentId},
        uploadUrl: resultsUrl,
        ...rest,
      } as Account
      account.ufgServer = {
        serverUrl: serviceUrl,
        uploadUrl: account.uploadUrl,
        stitchingServiceUrl: account.stitchingServiceUrl,
        accessToken,
        agentId: account.server.agentId,
        proxy: account.server.proxy,
      }
      return account
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
  }): Promise<{branchName?: string; parentBranchName?: string}> {
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
    logger.log('Request "getBatchBranches" called with settings', settings)
    const response = await req(`/api/sessions/batches/${settings.batchId}/config/bypointerId`, {
      name: 'getBatchBranches',
      method: 'GET',
      logger,
    })
    const result =
      response.status === 200
        ? await response.json().then((result: any) => {
            return {branchName: result.scmSourceBranch, parentBranchName: result.scmTargetBranch}
          })
        : {branchName: undefined, parentBranchName: undefined}
    logger.log('Request "getBatchBranches" finished successfully with body', result)
    return result
  }

  async function closeBatch({settings, logger = defaultLogger}: {settings: CloseBatchSettings; logger?: Logger}) {
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
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
    const agentId = `${defaultAgentId} ${settings.agentId ? `[${settings.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...settings, agentId}, fetch, logger})
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

  async function logEvent({
    settings,
    logger = defaultLogger,
  }: {
    settings: MaybeArray<LogEventSettings>
    logger?: Logger
  }) {
    settings = utils.types.isArray(settings) ? settings : [settings]
    const [config] = settings
    const agentId = `${defaultAgentId} ${config.agentId ? `[${config.agentId}]` : ''}`.trim()
    const req = makeReqEyes({config: {...config, agentId}, fetch, logger})
    logger.log('Request "logEvent" called with settings', settings)
    await req(`/api/sessions/log`, {
      name: 'logEvent',
      method: 'POST',
      body: {
        events: settings.map(settings => {
          return {
            event: settings.event,
            level: settings.level ?? 'Info',
            timestamp: settings.timestamp ?? new Date().toISOString(),
          }
        }),
      },
      expected: 200,
      logger,
    })
    logger.log('Request "logEvent" finished successfully')
  }
}

export function makeEyesRequests({
  core,
  test,
  req,
  upload,
  logger: defaultLogger,
}: {
  core: CoreRequests
  test: VisualTest
  req: ReqEyes
  upload: Upload
  logger: Logger
}): EyesRequests {
  let resultsPromise = undefined as Promise<TestResult[]> | undefined
  let supportsCheckAndClose = true

  const eyes = {
    core,
    test,
    get running() {
      return !resultsPromise
    },
    check,
    checkAndClose,
    report,
    close,
    abort,
    getResults,
  }

  return eyes

  async function check({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: ImageTarget
    settings: CheckSettings
    logger?: Logger
  }): Promise<CheckResult[]> {
    logger.log('Request "check" called for target', target, 'with settings', settings)
    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image as Buffer}),
      target.dom && upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'check',
      method: 'POST',
      body: transformCheckOptions({target, settings}),
      expected: 200,
      logger,
    })
    const result: any = await response.json()
    result.userTestId = test.userTestId
    logger.log('Request "check" finished successfully with body', result)
    return [result]
  }

  async function checkAndClose({
    target,
    settings,
    logger = defaultLogger,
  }: {
    target: ImageTarget
    settings: CheckSettings & CloseSettings
    logger?: Logger
  }): Promise<TestResult[]> {
    if (!supportsCheckAndClose) {
      logger.log('Request "checkAndClose" is notSupported by the server, using "check" and "close" requests instead')
      await check({target, settings, logger})
      await close({settings, logger})
      return getResults({settings, logger})
    }
    logger.log('Request "checkAndClose" called for target', target, 'with settings', settings)
    ;[target.image, target.dom] = await Promise.all([
      upload({name: 'image', resource: target.image as Buffer}),
      target.dom && upload({name: 'dom', resource: target.dom, gzip: true}),
    ])
    const matchOptions = transformCheckOptions({target, settings})
    resultsPromise = req(`/api/sessions/running/${encodeURIComponent(test.testId)}/matchandend`, {
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
      query: {
        updateBaseline: test.isNew ? settings?.updateBaselineIfNew : settings?.updateBaselineIfDifferent,
      },
      hooks: {
        beforeRetry({response, stop}) {
          if (response?.status === 404) return stop
        },
      },
      expected: 200,
      logger,
    }).then(async response => {
      if (response.status === 404) {
        supportsCheckAndClose = false
        return checkAndClose({target, settings})
      }
      const result: any = await response.json()
      result.userTestId = test.userTestId
      result.url = test.resultsUrl
      result.isNew = test.isNew
      result.initializedAt = test.initializedAt
      result.keepIfDuplicate = test.keepIfDuplicate
      result.server = test.server
      logger.log('Request "checkAndClose" finished successfully with body', result)
      return [result]
    })
    return resultsPromise
  }

  async function close({
    settings,
    logger = defaultLogger,
  }: {
    settings?: CloseSettings
    logger?: Logger
  } = {}): Promise<void> {
    logger.log(`Request "close" called for test ${test.testId} with settings`, settings)
    if (resultsPromise) {
      logger.log(`Request "close" called for test ${test.testId} that was already stopped`)
      return
    }
    resultsPromise = report({settings, logger})
      .then(() =>
        req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
          name: 'close',
          method: 'DELETE',
          query: {
            aborted: false,
            updateBaseline: test.isNew ? settings?.updateBaselineIfNew : settings?.updateBaselineIfDifferent,
          },
          expected: 200,
          logger,
        }),
      )
      .then(async response => {
        const result: any = await response.json()
        result.userTestId = test.userTestId
        result.url = test.resultsUrl
        result.isNew = test.isNew
        result.initializedAt = test.initializedAt
        result.keepIfDuplicate = test.keepIfDuplicate
        result.server = test.server
        // for backwards compatibility with outdated servers
        result.status ??= result.missing === 0 && result.mismatches === 0 ? 'Passed' : 'Unresolved'
        logger.log('Request "close" finished successfully with body', result)
        return [result]
      })
    return resultsPromise.then(() => undefined).catch(() => undefined)
  }

  async function abort({
    settings,
    logger = defaultLogger,
  }: {
    settings?: AbortSettings
    logger?: Logger
  } = {}): Promise<void> {
    logger.log(`Request "abort" called for test ${test.testId} with settings`, settings)
    if (resultsPromise) {
      logger.log(`Request "abort" called for test ${test.testId} that was already stopped`)
      return
    }
    resultsPromise = report({settings, logger})
      .then(() =>
        req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
          name: 'abort',
          method: 'DELETE',
          query: {
            aborted: true,
          },
          expected: 200,
          logger,
        }),
      )
      .then(async response => {
        const result: any = await response.json()
        result.userTestId = test.userTestId
        result.initializedAt = test.initializedAt
        result.keepIfDuplicate = test.keepIfDuplicate
        result.server = test.server
        logger.log('Request "abort" finished successfully with body', result)
        return [result]
      })
    return resultsPromise.then(() => undefined).catch(() => undefined)
  }

  async function getResults({
    settings,
    logger = defaultLogger,
  }: {
    settings?: GetResultsSettings
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    logger.log(`Request "getResults" called for test ${test.testId} with settings`, settings)
    if (!resultsPromise) {
      logger.warn(`The test with id "${test.testId}" is going to be auto aborted`)
      await abort({settings, logger})
    }
    const results = await resultsPromise!
    logger.log('Request "getResults" finished successfully with body', results)
    return results
  }

  async function report({
    settings,
    logger = defaultLogger,
  }: {
    settings?: ReportSettings
    logger?: Logger
  }): Promise<void> {
    logger.log(`Request "report" called for test ${test.testId} with settings`, settings)
    if (!settings?.testMetadata || utils.types.isEmpty(settings.testMetadata)) return
    try {
      await req(`/api/sessions/running/${encodeURIComponent(test.testId)}/selfhealdata`, {
        name: 'reportSelfHealing',
        method: 'PUT',
        body: {
          operations: settings.testMetadata.map(item => {
            return {old: item?.originalSelector, new: item?.successfulSelector, timestamp: new Date().toISOString()}
          }),
        },
        expected: 200,
        logger,
      })
    } catch (error) {
      logger.warn(error)
    }
  }
}

export function makeFunctionalSessionRequests({
  core,
  test,
  req,
  logger: defaultLogger,
}: {
  core: CoreRequests
  test: FunctionalTest
  req: ReqEyes
  logger: Logger
}): FunctionalSessionRequests {
  let resultsPromise = undefined as Promise<TestResult[]> | undefined

  const functionalSession = {
    core,
    test,
    get running() {
      return !resultsPromise
    },
    report,
    close,
    abort,
    getResults,
  }

  return functionalSession

  async function close({
    settings,
    logger = defaultLogger,
  }: {
    settings?: CloseSettings
    logger?: Logger
  } = {}): Promise<void> {
    logger.log(`Request "close" called for test ${test.testId} with settings`, settings)
    if (resultsPromise) {
      logger.log(`Request "close" called for test ${test.testId} that was already stopped`)
      return
    }
    resultsPromise = report({settings, logger})
      .then(() =>
        req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
          name: 'close',
          method: 'DELETE',
          query: {aborted: false, nonVisualStatus: settings?.status ?? 'Completed'},
          expected: 200,
          logger,
        }),
      )
      .then(async response => {
        const result: any = await response.json()
        result.userTestId = test.userTestId
        result.url = test.resultsUrl
        result.initializedAt = test.initializedAt
        result.keepIfDuplicate = test.keepIfDuplicate
        result.server = test.server
        logger.log('Request "close" finished successfully with body', result)
        return [result]
      })
    return resultsPromise.then(() => undefined).catch(() => undefined)
  }

  async function abort({
    settings,
    logger = defaultLogger,
  }: {
    settings?: AbortSettings
    logger?: Logger
  } = {}): Promise<void> {
    logger.log(`Request "abort" called for test ${test.testId} with settings`, settings)
    if (resultsPromise) {
      logger.log(`Request "abort" called for test ${test.testId} that was already stopped`)
      return
    }
    resultsPromise = report({settings, logger})
      .then(() =>
        req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
          name: 'abort',
          method: 'DELETE',
          query: {
            aborted: true,
          },
          expected: 200,
          logger,
        }),
      )
      .then(async response => {
        const result: any = await response.json()
        result.userTestId = test.userTestId
        result.initializedAt = test.initializedAt
        result.keepIfDuplicate = test.keepIfDuplicate
        result.server = test.server
        logger.log('Request "abort" finished successfully with body', result)
        return [result]
      })
    return resultsPromise.then(() => undefined).catch(() => undefined)
  }

  async function getResults({
    settings,
    logger = defaultLogger,
  }: {
    settings?: GetResultsSettings
    logger?: Logger
  } = {}): Promise<TestResult[]> {
    logger.log(`Request "getResults" called for test ${test.testId} with settings`, settings)
    if (!resultsPromise) {
      logger.warn(`The test with id "${test.testId}" is going to be auto aborted`)
      await abort({settings, logger})
    }
    const results = await resultsPromise!
    logger.log('Request "getResults" finished successfully with body', results)
    return results
  }

  async function report({
    settings,
    logger = defaultLogger,
  }: {
    settings?: ReportSettings
    logger?: Logger
  }): Promise<void> {
    logger.log(`Request "report" called for test ${test.testId} with settings`, settings)
    if (!settings?.testMetadata || utils.types.isEmpty(settings.testMetadata)) return
    try {
      await req(`/api/sessions/running/${encodeURIComponent(test.testId)}/selfhealdata`, {
        name: 'reportSelfHealing',
        method: 'PUT',
        body: {
          operations: settings.testMetadata.map(item => {
            return {old: item?.originalSelector, new: item?.successfulSelector, timestamp: new Date().toISOString()}
          }),
        },
        expected: 200,
        logger,
      })
    } catch (error) {
      logger.warn(error)
    }
  }
}

function transformCheckOptions({target, settings}: {target: ImageTarget; settings: CheckSettings}) {
  return {
    appOutput: {
      title: target.name,
      screenshotUrl: target.image,
      domUrl: target.dom,
      location: target.locationInViewport && utils.geometry.round(target.locationInViewport),
      pageCoverageInfo: settings.pageId && {
        pageId: settings.pageId,
        imagePositionInPage: target.locationInView && utils.geometry.round(target.locationInView),
        ...(target.fullViewSize && utils.geometry.round(target.fullViewSize)),
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
        matchLevel: settings.matchLevel ?? 'Strict',
        useDom: settings.useDom ?? false,
        densityMetrics: settings.densityMetrics,
      },
      name: settings.name,
      source: target.source,
      renderId: settings.renderId,
      variantId: settings.userCommandId,
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
  regions: CheckSettings<Region>[`${'ignore' | 'layout' | 'content' | 'strict' | 'floating' | 'accessibility'}Regions`]
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
          const offset = region.offset as any
          options.maxUpOffset = offset.top
          options.maxDownOffset = offset.bottom
          options.maxLeftOffset = offset.left
          options.maxRightOffset = offset.right
        }
        region = utils.geometry.round(utils.geometry.padding(region.region, region.padding ?? 0))
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
    return (regions: any[], region: any, index: number) => {
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

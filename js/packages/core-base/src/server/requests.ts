import type {Region, TextRegion, Batch} from '@applitools/types'
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
import {type Logger} from '@applitools/logger'
import {makeReqEyes, type ReqEyes} from './req-eyes'
import * as utils from '@applitools/utils'

interface AccountInfo {
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
}

export interface CoreRequests extends Core {
  openEyes(options: {settings: OpenSettings}): Promise<EyesRequests>
  getAccountInfo(options: {settings: ServerSettings}): Promise<AccountInfo>
  getBatch(options: {settings: ServerSettings & {batchId: string}}): Promise<Batch>
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
  close(options: {settings: CloseSettings}): Promise<TestResult[]>
  abort(): Promise<TestResult[]>
}

export function makeCoreCommands({logger}: {logger?: Logger}): CoreRequests {
  return {openEyes, getAccountInfo, getBatch, closeBatch, deleteTest}

  async function openEyes({settings}: {settings: OpenSettings}): Promise<EyesRequests> {
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "openEyes" called with settings', settings)
    const response = await req('/api/sessions/running', {
      name: 'openEyes',
      method: 'POST',
      body: {
        startInfo: {
          agentSessionId: utils.general.guid(),
          agentId: settings.agentId,
          sessionType: settings.sessionType,
          appIdOrName: settings.appName,
          scenarioIdOrName: settings.testName,
          displayName: settings.displayName,
          batchInfo: {
            id: settings.batch.id,
            name: settings.batch.name,
            batchSequenceName: settings.batch.sequenceName,
            startedAt: settings.batch.startedAt,
            notifyOnCompletion: settings.batch.notifyOnCompletion,
            properties: settings.batch.properties,
          },
          baselineEnvName: settings.baselineEnvName,
          environmentName: settings.environmentName,
          environment: {
            os: settings.environment.os,
            osInfo: settings.environment.osInfo,
            hostingApp: settings.environment.hostingApp,
            hostingAppInfo: settings.environment.hostingAppInfo,
            deviceName: settings.environment.deviceName,
            displaySize: settings.environment.viewportSize,
            inferred: settings.environment.userAgent,
          },
          branchName: settings.branchName,
          parentBranchName: settings.parentBranchName,
          baselineBranchName: settings.baselineBranchName,
          compareWithParentBranch: settings.compareWithParentBranch,
          ignoreBaseline: settings.ignoreBaseline,
          saveDiffs: settings.saveDiffs,
          properties: settings.properties,
          timeout: settings.abortIdleTestTimeout,
          // parentBranchBaselineSavedBefore,
          // defaultMatchSettings: getDefaultMatchSettings(),
          // agentRunId: this.agentRunId,
        },
      },
      expected: [200, 201],
    })
    const test = await response.json().then(test => {
      return {
        testId: test.id,
        batchId: test.batchId,
        baselineId: test.baselineId,
        sessionId: test.sessionId,
        resultsUrl: test.url,
        isNew: test.isNew ?? response.status === 201,
      }
    })
    logger.log('Request "openEyes" finished successfully with body', test)
    return makeEyesCommands({req, test, logger})
  }

  async function getAccountInfo({settings}: {settings: ServerSettings}): Promise<AccountInfo> {
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "getAccountInfo" called with settings', settings)
    const response = await req('/api/sessions/renderinfo', {
      name: 'getAccountInfo',
      method: 'GET',
      expected: 200,
    })
    const result = await response.json().then(result => {
      const {serviceUrl, accessToken, resultUrl, ...rest} = result
      return {renderUrl: serviceUrl, renderToken: accessToken, uploadUrl: resultUrl, ...rest}
    })
    logger.log('Request "getAccountInfo" finished successfully with body', result)
    return result
  }

  async function getBatch({settings}: {settings: ServerSettings & {batchId: string}}): Promise<Batch> {
    const req = makeReqEyes({config: settings, logger})
    logger.log('Request "getBatch" called with settings', settings)
    const response = await req(`/api/sessions/batches/${settings.batchId}/config/bypointerId`, {
      name: 'getBatch',
      method: 'GET',
      expected: 200,
    })
    const result = await response.json()
    logger.log('Request "getBatch" finished successfully with body', result)
    return result
  }

  async function closeBatch({settings}: {settings: CloseBatchSettings}) {
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

export function makeEyesCommands({test, req, logger}: {test: Test; req: ReqEyes; logger?: Logger}): EyesRequests {
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
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'check',
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

  async function extractText({target, settings}: {target: Target; settings: ExtractTextSettings}): Promise<string[]> {
    logger.log('Request "extractText" called for target', target, 'with settings', settings)
    const response = await req('/api/sessions/running/images/text', {
      name: 'extractText',
      method: 'POST',
      body: {
        appOutput: {
          screenshotUrl: target.image,
          domUrl: target.dom,
          location: target.location,
        },
        regions: settings.regions,
        minMatch: settings.minMatch,
        language: settings.language,
      },
      expected: 200,
    })
    const result = await response.json()
    logger.log('Request "extractText" finished successfully with body', result)
    return result
  }

  async function close({settings}: {settings: CloseSettings}): Promise<TestResult[]> {
    logger.log(`Request "close" called for test ${test.testId} with settings`, settings)
    const response = await req(`/api/sessions/running/${encodeURIComponent(test.testId)}`, {
      name: 'close',
      method: 'DELETE',
      query: {
        aborted: false,
        updateBaseline: test.isNew ? settings.updateBaselineIfNew : settings.updateBaselineIfDifferent,
      },
      expected: 200,
    })
    const result: TestResult = await response.json()
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

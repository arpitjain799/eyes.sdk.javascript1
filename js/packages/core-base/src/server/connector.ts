import type {Region, TextRegion, Batch} from '@applitools/types'
import type {
  Target,
  Config,
  CheckSettings,
  LocateSettings,
  LocateTextSettings,
  ExtractTextSettings,
  CheckResult,
  TestResult,
} from '@applitools/types/types/core-base'
import {makeReqEyes, type Options} from './req-eyes'
import * as utils from '@applitools/utils'

interface Info {
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

export interface Connector {
  getInfo(): Info
  getBatch(): Promise<Batch>
  closeBatch(): Promise<void>
  open(options: {config: Config}): Promise<Test>
  check(options: {test: Test; target: Target; settings: CheckSettings}): Promise<CheckResult>
  locate<TLocator extends string>(options: {
    test: Test
    target: Target
    settings: LocateSettings<TLocator>
  }): Promise<Record<TLocator, Region[]>>
  locateText<TPattern extends string>(options: {
    test: Test
    target: Target
    settings: LocateTextSettings<TPattern>
  }): Record<TPattern, TextRegion[]>
  extractText(options: {test: Test; target: Target; settings: ExtractTextSettings}): Promise<string[]>
  checkAndClose(options: {test: Test; target: Target; settings: CheckSettings}): Promise<TestResult>
  close(options: {test: Test}): Promise<TestResult>
  delete(options: {result: TestResult}): Promise<void>
}

export function makeConnector(options: Options): Connector {
  const req = makeReqEyes(options)

  async function open({config}: {config: Config}): Promise<Test> {
    logger.log('connector.open called with', config)

    const response = await req('./running', {
      method: 'POST',
      body: {
        startInfo: {
          agentSessionId: utils.general.guid(),
          agentId: config.agentId ? `${config.agentId} [${__baseAgentId}]` : __baseAgentId,
          sessionType: config.sessionType,
          appIdOrName: config.appName,
          scenarioIdOrName: config.testName,
          displayName: config.displayName,
          batchInfo: {
            id: config.batch.id,
            name: config.batch.name,
            batchSequenceName: config.batch.sequenceName,
            startedAt: config.batch.startedAt,
            notifyOnCompletion: config.batch.notifyOnCompletion,
            properties: config.batch.properties,
          },
          baselineEnvName: config.baselineEnvName,
          environmentName: config.environmentName,
          environment: {
            os: config.environment.os,
            osInfo: config.environment.osInfo,
            hostingApp: config.environment.hostingApp,
            hostingAppInfo: config.environment.hostingAppInfo,
            deviceName: config.environment.deviceName,
            displaySize: config.environment.viewportSize,
            // inferred:
          },
          branchName: config.branchName,
          parentBranchName: config.parentBranchName,
          baselineBranchName: config.baselineBranchName,
          compareWithParentBranch: config.compareWithParentBranch,
          ignoreBaseline: config.ignoreBaseline,
          saveDiffs: config.saveDiffs,
          properties: config.properties,
          timeout: config.abortIdleTestTimeout,
          // parentBranchBaselineSavedBefore,
          // defaultMatchSettings: getDefaultMatchSettings(),
          // agentRunId: this.agentRunId,
        },
      },
    })

    if (![200, 201].includes(response.status)) {
      throw new Error(`open request - unexpected status (status=${response.status}, statusText=${response.statusText})`)
    }

    const data = await response.json()
    const test: Test = {
      testId: data.id,
      batchId: data.batchId,
      baselineId: data.baselineId,
      sessionId: data.sessionId,
      resultsUrl: data.url,
      isNew: data.isNew ?? response.status === 201,
    }

    logger.log('connector.open - succeeded', test)

    return test
  }

  async function check({
    test,
    target,
    settings,
  }: {
    test: Test
    target: Target
    settings: CheckSettings
  }): Promise<CheckResult> {
    const response = await req(`./running/${test.testId}`, {
      method: 'POST',
      body: {
        tag: settings.name,
        ignoreMismatch: settings.ign
        options: {

        }
      }
    })

  }

  return {
    open,
  }
}

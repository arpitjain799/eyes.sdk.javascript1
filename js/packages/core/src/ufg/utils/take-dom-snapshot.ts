import {type Logger} from '@applitools/logger'
import {type Context} from '@applitools/driver'
import {getProcessPagePoll, getPollResult, getProcessPagePollForIE, getPollResultForIE} from '@applitools/dom-snapshot'
import {executePollScript, type PollScriptSettings} from '../../utils/execute-poll-script'
import * as utils from '@applitools/utils'

export type DomSnapshotSettings = Partial<PollScriptSettings> & {
  disableBrowserFetching?: boolean
  skipResources?: string[]
  chunkByteLength?: number
  showLogs?: boolean
}

export async function takeDomSnapshot<TContext extends Context<unknown, unknown, unknown, unknown>>({
  context,
  settings,
  hooks,
  logger,
}: {
  context: TContext
  settings: DomSnapshotSettings
  hooks?: {beforeEachContextSnapshot?(options: {context: TContext}): void | Promise<void>}
  logger: Logger
}) {
  const driver = context.driver
  const isLegacyBrowser = driver.isIE || driver.isEdgeLegacy

  const arg = {
    dontFetchResources: settings.disableBrowserFetching,
    skipResources: settings.skipResources,
    removeReverseProxyURLPrefixes: Boolean(process.env.APPLITOOLS_SCRIPT_REMOVE_REVERSE_PROXY_URL_PREFIXES),
    chunkByteLength:
      settings?.chunkByteLength ??
      (Number(process.env.APPLITOOLS_SCRIPT_RESULT_MAX_BYTE_LENGTH) || (driver.isIOS ? 100_000 : 250 * 1024 * 1024)),
    serializeResources: true,
    compressResources: false,
    showLogs: settings.showLogs,
  }
  const scripts = {
    main: {
      script: `return (${
        isLegacyBrowser ? await getProcessPagePollForIE() : await getProcessPagePoll()
      }).apply(null, arguments);`,
      args: [arg],
    },
    poll: {
      script: `return (${isLegacyBrowser ? await getPollResultForIE() : await getPollResult()}).apply(null, arguments);`,
      args: [arg],
    },
  }

  const snapshot = await takeContextDomSnapshot({context})
  return deserializeDomSnapshot({snapshot})

  async function takeContextDomSnapshot({context}: {context: TContext}) {
    // logger.log(`taking dom snapshot. ${context._reference ? `context referece: ${JSON.stringify(context._reference)}` : ''}`)

    await hooks?.beforeEachContextSnapshot?.({context})

    const snapshot = await executePollScript({
      context,
      scripts,
      settings: {executionTimeout: settings?.executionTimeout ?? 5 * 60 * 1000, pollTimeout: settings?.pollTimeout ?? 200},
      logger,
    })

    const crossFrames = extractCrossFrames({snapshot, logger})
    for (const {reference, parentSnapshot, cdtNode} of crossFrames) {
      const frameContext = await context
        .context(reference)
        .then(context => context.focus())
        .catch(err => {
          logger.log(`could not switch to frame during takeDomSnapshot. Path to frame: ${JSON.stringify(reference)}`, err)
        })

      if (frameContext) {
        const frameSnapshot = await takeContextDomSnapshot({context: frameContext as TContext})
        const url = new URL(/^data:text\/html/.test(frameSnapshot.url) ? 'http://data-url-frame' : (frameSnapshot.url as string))
        url.searchParams.append('applitools-iframe', utils.general.guid())
        frameSnapshot.url = url.href
        parentSnapshot.frames.push(frameSnapshot)
        cdtNode.attributes.push({name: 'data-applitools-src', value: frameSnapshot.url})
      }
    }

    logger.log(`dom snapshot cdt length: ${snapshot.cdt.length}`)
    logger.log(`blobs urls (${snapshot.blobs.length}):`, JSON.stringify(snapshot.blobs.map(({url}) => url))) // eslint-disable-line prettier/prettier
    logger.log(`resource urls (${snapshot.resourceUrls.length}):`, JSON.stringify(snapshot.resourceUrls)) // eslint-disable-line prettier/prettier
    return snapshot
  }
}

export function deserializeDomSnapshot({snapshot}) {
  const deserializedSnapshot = {
    ...snapshot,
    resourceContents: snapshot.blobs.reduce((resourceContents, blob) => {
      if (blob.value === undefined) return {...resourceContents, [blob.url]: blob}
      else return {...resourceContents, [blob.url]: {...blob, value: Buffer.from(blob.value, 'base64')}}
    }, {}),
    frames: snapshot.frames.map(deserializeDomSnapshot),
  }
  delete deserializedSnapshot.blobs
  delete deserializedSnapshot.selector
  delete deserializedSnapshot.crossFrames
  return deserializedSnapshot
}

export function extractCrossFrames({snapshot, parent = null, logger}): any[] {
  const crossFrames = [snapshot, ...(snapshot.frames ?? [])].flatMap(snapshot => {
    const crossFrames = (snapshot.crossFrames ?? []).map(({selector, index}) => ({
      reference: {reference: {type: 'css', selector}, parent},
      parentSnapshot: snapshot,
      cdtNode: snapshot.cdt[index],
    }))
    return [
      ...crossFrames,
      ...extractCrossFrames({snapshot, parent: {reference: {type: 'css', selector: snapshot.selector}, parent}, logger}),
    ]
  })

  logger.log(`frames paths for ${snapshot.crossFrames}`, crossFrames.map(({reference}) => reference.join('-->')).join(' , '))

  return crossFrames
}

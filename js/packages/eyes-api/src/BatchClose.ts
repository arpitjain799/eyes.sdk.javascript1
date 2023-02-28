import type * as Core from '@applitools/core'
import {makeSDK, type SDKOptions} from './SDK'
import * as utils from '@applitools/utils'
import {ProxySettings} from './input/ProxySettings'

type BatchCloseOptions = {
  batchIds: string[]
  serverUrl: string
  apiKey: string
  proxy?: ProxySettings
}

export function closeBatch(sdk: SDKOptions): (options: BatchCloseOptions) => Promise<void> {
  return (settings: BatchCloseOptions) => {
    utils.guard.notNull(settings.batchIds, {name: 'options.batchIds'})
    const {core} = makeSDK(sdk)
    return core.closeBatch({settings: settings.batchIds.map(batchId => ({batchId, ...settings}))})
  }
}

export class BatchClose {
  protected static readonly _sdk: SDKOptions
  protected get _sdk(): SDKOptions {
    return (this.constructor as typeof BatchClose)._sdk
  }

  private _core: Core.Core<Core.SpecType, 'classic' | 'ufg'>
  private _settings = {} as BatchCloseOptions

  static async close(settings: BatchCloseOptions): Promise<void> {
    utils.guard.notNull(settings.batchIds, {name: 'options.batchIds'})
    const {core} = makeSDK(this._sdk)
    await core.closeBatch({settings: settings.batchIds.map(batchId => ({batchId, ...settings}))})
  }

  constructor(options?: BatchCloseOptions) {
    const {core} = makeSDK(this._sdk)
    this._core = core
    if (options) this._settings = options
  }

  async close(): Promise<void> {
    utils.guard.notNull(this._settings.batchIds, {name: 'batchIds'})
    await this._core.closeBatch({settings: this._settings.batchIds.map(batchId => ({batchId, ...this._settings}))})
  }

  setBatchIds(batchIds: string[]): this {
    this._settings.batchIds = batchIds
    return this
  }

  setUrl(serverUrl: string): this {
    this._settings.serverUrl = serverUrl
    return this
  }

  setApiKey(apiKey: string): this {
    this._settings.apiKey = apiKey
    return this
  }

  setProxy(proxy: ProxySettings): this {
    this._settings.proxy = proxy
    return this
  }
}

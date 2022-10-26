import type {Size} from '@applitools/utils'
import type {ClientSocket, Ref} from '../../../../src/types'
import type * as core from '@applitools/core'
import {type Logger} from '@applitools/logger'
import type {CliType} from './spawn-server'
import {makeLogger} from '@applitools/logger'
import spawnServer from './spawn-server'
import {type ChildProcess} from 'child_process'

export type TransformFunc = (data: any) => Promise<any>

export class UniversalClient<TDriver, TElement, TSelector>
  implements
    Omit<
      core.Core<TDriver, TElement, TSelector>,
      'isDriver' | 'openEyes' | 'getAccountInfo' | 'closeBatch' | 'logEvent'
    >
{
  protected _transform: TransformFunc
  // @TODO
  // should document the useage of the environment variable
  private _cliType: CliType = process.env.UNIVERSAL_CLIENT_CLI_TYPE as CliType

  private _socket: ClientSocket<TDriver, TDriver, TElement, TSelector>
  private _server: ChildProcess

  private _logger: Logger = makeLogger({label: 'universal client'})
  private async _getSocket() {
    if (!this._socket) {
      const {socket, server} = await spawnServer({logger: this._logger, cliType: this._cliType})
      this._socket = socket
      this._server = server
    }
    return this._socket
  }

  killServer() {
    return this._server?.kill()
  }

  async makeManager<TType extends 'classic' | 'ufg' = 'classic'>(options: {
    type: TType
    concurrency?: TType extends 'ufg' ? number : never
    agentId?: string
    logger?: Logger
  }): Promise<EyesManager<TDriver, TElement, TSelector, TType>> {
    const socket = await this._getSocket()
    const manager = await socket.request('Core.makeManager', options)
    return new EyesManager({manager, socket, transform: this._transform})
  }

  async locate<TLocator extends string>({
    target,
    settings,
    config,
  }: {
    target?: TDriver
    settings: core.LocateSettings<TLocator, TElement, TSelector>
    config?: core.Config<TElement, TSelector, 'classic'>
  }): Promise<core.LocateResult<TLocator>> {
    return this._socket.request('Core.locate', {
      target: await this._transform(target),
      settings,
      config: await this._transform(config),
    })
  }

  async getViewportSize({target}: {target: TDriver}): Promise<Size> {
    const socket = await this._getSocket()
    return socket.request('Core.getViewportSize', {
      target: await this._transform(target),
    })
  }

  async setViewportSize({target, size}: {target: TDriver; size: Size}): Promise<void> {
    const socket = await this._getSocket()
    return socket.request('Core.setViewportSize', {
      target: await this._transform(target),
      size,
    })
  }

  async closeBatches(options: any): Promise<void> {
    const socket = await this._getSocket()
    return socket.request('Core.closeBatch', options)
  }

  async deleteTest(options: any): Promise<void> {
    const socket = await this._getSocket()
    return socket.request('Core.deleteTest', options)
  }

  // not used, just to adhere to types.Core<TDriver, TElement, TSelector>
  isTDriver(driver: any): driver is TDriver {
    return false
  }

  isElement(element: any): element is TElement {
    return false
  }

  isSelector(selector: any): selector is TSelector {
    return false
  }
}

export class EyesManager<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'>
  implements core.EyesManager<TDriver, TElement, TSelector, TType>
{
  private _manager: Ref
  private _socket: ClientSocket<TDriver, TDriver, TElement, TSelector>
  private _transform: TransformFunc

  constructor({
    manager,
    socket,
    transform,
  }: {
    manager: Ref
    socket: ClientSocket<TDriver, TDriver, TElement, TSelector>
    transform: TransformFunc
  }) {
    this._manager = manager
    this._socket = socket
    this._transform = transform
  }

  async openEyes({target, config}: {target?: TDriver; config?: core.Config<TElement, TSelector, TType>}): Promise<any> {
    const eyes = await this._socket.request('EyesManager.openEyes', {
      manager: this._manager,
      target: await this._transform(target),
      config: await this._transform(config),
    })
    return new Eyes({eyes, socket: this._socket, transform: this._transform})
  }

  async closeManager({
    settings,
    logger,
  }: {
    settings?: {throwErr?: boolean}
    logger?: Logger
  } = {}): Promise<core.TestResultSummary<TType>> {
    return this._socket.request('EyesManager.closeManager', {manager: this._manager, settings, logger})
  }
}

// not to be confused with the user-facing Eyes class
export class Eyes<TDriver, TElement, TSelector, TType extends 'classic' | 'ufg'>
  implements
    Omit<
      core.Eyes<TDriver, TElement, TSelector, 'classic'>,
      'test' | 'aborted' | 'closed' | 'running' | 'checkAndClose'
    >,
    Omit<
      core.Eyes<TDriver, TElement, TSelector, 'ufg'>,
      'test' | 'aborted' | 'closed' | 'running' | 'checkAndClose' | 'locateText' | 'extractText'
    >
{
  private _eyes: Ref
  private _socket: ClientSocket<TDriver, TDriver, TElement, TSelector>
  private _transform: TransformFunc

  constructor({
    eyes,
    socket,
    transform,
  }: {
    socket: ClientSocket<TDriver, TDriver, TElement, TSelector>
    eyes: Ref
    transform: TransformFunc
  }) {
    this._eyes = eyes
    this._socket = socket
    this._transform = transform
  }

  async check({
    settings,
    config,
  }: {
    settings: core.CheckSettings<TElement, TSelector, TType>
    config?: core.Config<TElement, TSelector, TType>
  }): Promise<core.CheckResult<TType>[]> {
    return this._socket.request('Eyes.check', {
      eyes: this._eyes,
      settings: await this._transform(settings),
      config: await this._transform(config),
    })
  }

  async locateText<TPattern extends string>({
    settings,
    config,
  }: {
    settings: core.LocateTextSettings<TPattern, TElement, TSelector, TType>
    config?: core.Config<TElement, TSelector, TType>
  }): Promise<core.LocateTextResult<TPattern>> {
    return this._socket.request('Eyes.locateText', {
      eyes: this._eyes,
      settings,
      config: await this._transform(config),
    })
  }

  async extractText({
    settings,
    config,
  }: {
    settings: core.ExtractTextSettings<TElement, TSelector, TType>
    config?: core.Config<TElement, TSelector, TType>
  }): Promise<string[]> {
    return this._socket.request('Eyes.extractText', {
      eyes: this._eyes,
      settings: await this._transform(settings),
      config: await this._transform(config),
    })
  }

  close({settings}: {settings: core.CloseSettings<TType>}): Promise<core.TestResult<TType>[]> {
    return this._socket.request('Eyes.close', {eyes: this._eyes, settings})
  }

  abort(): Promise<core.TestResult<TType>[]> {
    return this._socket.request('Eyes.abort', {eyes: this._eyes})
  }
}

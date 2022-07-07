import type * as types from '@applitools/types'
import type {ChildProcess} from 'child_process'
import type {
  Driver,
  Element,
  Selector,
  TransformedDriver,
  TransformedElement,
  TransformedSelector,
} from './transform-driver'
import type {Socket} from '../../../src/socket'
import {fork} from 'child_process'
import {makeSocket} from '../../../src/socket'
import {transform} from './transform-driver'
import {type Logger, makeLogger} from '@applitools/logger'
import {exec} from 'child_process'
import {promisify} from 'util'
const pexec = promisify(exec)

type ClientSocket = Socket &
  types.ClientSocket<TransformedDriver, TransformedDriver, TransformedElement, TransformedSelector>

type DriverType = 'local' | 'sauce' | 'browserstack' | 'local-appium'

const DRIVER_URLS = {
  local: 'http://localhost:4444/wd/hub',
  sauce: 'https://ondemand.saucelabs.com/wd/hub',
  browserstack: 'https://hub.browserstack.com/wd/hub',
  'local-appium': 'http://localhost:4723/wd/hub',
}

export class UniversalClient implements types.Core<Driver, Element, Selector> {
  private _server: ChildProcess
  private _socket: ClientSocket
  private _driverType: DriverType
  private _logger: Logger

  static async killServer() {
    const pid = (await pexec('lsof -ti :21077').catch(() => ({stdout: ''}))).stdout.trim()
    if (pid) {
      await pexec(`kill -9 ${pid}`)
    }
  }

  constructor({driverType = 'local'}: {driverType?: DriverType} = {}) {
    this._logger = makeLogger({label: 'universal-client'})
    this._driverType = driverType
    this._socket = makeSocket(undefined, {logger: this._logger})
    this._server = fork('./dist/cli.js', {
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    })
    // specific to JS: we are able to listen to stdout for the first line, then we know the server is up, and we even can get its port in case it wasn't passed
    this._server.once('message', ({name, payload}: {name: string; payload: any}) => {
      if (name === 'port') {
        const {port} = payload
        this._logger.log('server is spawned at port', port)
        this._server.channel?.unref()
        this._socket.connect(`http://localhost:${port}/eyes`)
        this._socket.emit('Core.makeSDK', {
          name: 'eyes-universal-tests',
          version: require('../../../package.json').version,
          protocol: 'webdriver',
          cwd: process.cwd(),
        })
      }
    })

    // TODO without doing this, the parent process hangs and cannot exit.
    // But it creates issues:
    // (a) the server keeps running,
    // (b) the Node.js mocha process just exits because it doesn't know about anything to wait on.
    //     I solved it with an ugly hack of a large timeout that I set at the beginning and clear at the end. But it needs to be resolved somehow.
    this._server.unref()
    this._socket.unref()
  }

  async makeManager(config?: types.EyesManagerConfig): Promise<EyesManager> {
    const manager = await this._socket.request('Core.makeManager', config)

    return new EyesManager({manager, socket: this._socket, driverType: this._driverType})
  }

  async getViewportSize({driver}: {driver: Driver}): Promise<types.Size> {
    return this._socket.request('Core.getViewportSize', {
      driver: await transform(driver),
    })
  }

  async setViewportSize({driver, size}: {driver: Driver; size: types.Size}): Promise<void> {
    return this._socket.request('Core.setViewportSize', {
      driver: await transform(driver),
      size,
    })
  }

  async closeBatches(options: any): Promise<void> {
    return this._socket.request('Core.closeBatch', options)
  }

  async deleteTest(options: any): Promise<void> {
    return this._socket.request('Core.deleteTest', options)
  }

  // for testing purposes
  async closeServer() {
    return this._server.kill()
  }

  // not used, just to adhere to types.Core<Driver, Element, Selector>
  isDriver(driver: any): driver is Driver {
    return false
  }

  isElement(element: any): element is Element {
    return false
  }

  isSelector(selector: any): selector is Selector {
    return false
  }
}

export class EyesManager implements types.EyesManager<Driver, Element, Selector> {
  private _manager: types.Ref
  private _socket: ClientSocket
  private _driverType: DriverType

  constructor({
    manager,
    socket,
    driverType = 'local',
  }: {
    manager: types.Ref
    socket: ClientSocket
    driverType: DriverType
  }) {
    this._manager = manager
    this._socket = socket
    this._driverType = driverType
  }

  async openEyes({driver, config}: {driver: Driver; config?: types.EyesConfig<Element, Selector>}): Promise<Eyes> {
    const eyes = await this._socket.request('EyesManager.openEyes', {
      manager: this._manager,
      driver: await transform(driver, DRIVER_URLS[this._driverType]),
      config: await transform(config),
    })
    return new Eyes({eyes, socket: this._socket})
  }

  async closeManager(options?: {throwErr: boolean}): Promise<types.TestResultSummary> {
    return this._socket.request('EyesManager.closeManager', {manager: this._manager, throwErr: options?.throwErr})
  }
}

// not to be confused with the user-facing Eyes class
export class Eyes implements types.Eyes<Driver, Element, Selector> {
  private _eyes: types.Ref
  private _socket: ClientSocket

  constructor({eyes, socket}: any) {
    this._eyes = eyes
    this._socket = socket
  }

  async check({
    settings,
    config,
  }: {
    settings: types.CheckSettings<Element, Selector>
    config?: types.EyesConfig<Element, Selector>
  }): Promise<types.MatchResult> {
    return this._socket.request('Eyes.check', {
      eyes: this._eyes,
      settings: await transform(settings),
      config: await transform(config),
    })
  }

  async locate<TLocator extends string>({
    settings,
    config,
  }: {
    settings: types.LocateSettings<TLocator>
    config?: types.EyesConfig<Element, Selector>
  }): Promise<Record<TLocator, types.Region[]>> {
    return this._socket.request('Eyes.locate', {
      eyes: this._eyes,
      settings,
      config: await transform(config),
    })
  }

  async extractTextRegions<TPattern extends string>({
    settings,
    config,
  }: {
    settings: types.OCRSearchSettings<TPattern>
    config?: types.EyesConfig<Element, Selector>
  }): Promise<Record<TPattern, types.TextRegion[]>> {
    return this._socket.request('Eyes.extractTextRegions', {
      eyes: this._eyes,
      settings,
      config: await transform(config),
    })
  }

  async extractText({
    regions,
    config,
  }: {
    regions: types.OCRExtractSettings<Element, Selector>[]
    config?: types.EyesConfig<Element, Selector>
  }): Promise<string[]> {
    return this._socket.request('Eyes.extractText', {
      eyes: this._eyes,
      regions: await transform(regions),
      config: await transform(config),
    })
  }

  close(options: {throwErr: boolean}): Promise<types.TestResult[]> {
    return this._socket.request('Eyes.close', {eyes: this._eyes, throwErr: options.throwErr})
  }

  abort(): Promise<types.TestResult[]> {
    return this._socket.request('Eyes.abort', {eyes: this._eyes})
  }
}

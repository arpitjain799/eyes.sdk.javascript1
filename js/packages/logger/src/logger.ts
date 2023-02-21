import {type Handler} from './handler'
import {makeConsoleHandler, type ConsoleHandler} from './handler-console'
import {makeFileHandler, type FileHandler} from './handler-file'
import {makeRollingFileHandler, type RollingFileHandler} from './handler-rolling-file'
import {makeDebugHandler, type DebugHandler} from './handler-debug'
import {makePrinter, type Printer, type PrinterOptions} from './printer'
import {LogLevel, type LogLevelName} from './log-level'
import {format as defaultFormat, type ColoringOptions} from './format'
import * as utils from '@applitools/utils'

export type LoggerOptions = Omit<Partial<PrinterOptions>, 'handler' | 'level' | 'colors'> & {
  handler?: ConsoleHandler | FileHandler | RollingFileHandler | DebugHandler | Handler
  level?: LogLevelName | number
  colors?: boolean | ColoringOptions
  console?: boolean | Handler
}

export type ExtendOptions = Omit<LoggerOptions, 'handler'>

export interface Logger extends Printer {
  isLogger: true
  console: Printer
  tag(name: string, value: any): void
  mask(value: string): void
  mask(regexp: RegExp): void
  extend(options?: ExtendOptions): Logger
  open(): void
  close(): void
}

export function makeLogger(options: LoggerOptions & {extended?: boolean} = {}): Logger {
  let forceInitHandler: boolean
  if (!options.handler) {
    if (utils.general.getEnvValue('LOG_FILE')) {
      options.handler = {type: 'file', filename: utils.general.getEnvValue('LOG_FILE')}
    } else if (utils.general.getEnvValue('LOG_DIR')) {
      options.handler = {type: 'rolling file', dirname: utils.general.getEnvValue('LOG_DIR')}
    } else if (utils.general.getEnvValue('SHOW_LOGS', 'boolean')) {
      options.handler = {type: 'console'}
    } else if (process.env.DEBUG) {
      options.handler = {type: 'debug', label: options.label}
      options.level = LogLevel.all
      options.label = undefined
      options.timestamp = false
      forceInitHandler = true
    } else {
      options.handler = {type: 'console'}
    }
  }

  let level: number
  if (!utils.types.isNumber(options.level)) {
    const levelName =
      options.level ??
      (utils.general.getEnvValue('LOG_LEVEL') as LogLevelName) ??
      (utils.general.getEnvValue('SHOW_LOGS', 'boolean') ? 'all' : 'silent')
    level = LogLevel[levelName] ?? LogLevel.silent
  } else {
    level = options.level
  }

  let colors: ColoringOptions | undefined
  if (options.colors === false) {
    colors = undefined
  } else if (options.colors === true || utils.general.getEnvValue('LOG_COLORS', 'boolean')) {
    colors = {
      label: 'cyan',
      timestamp: 'greenBright',
      tags: 'blueBright',
      level: {
        info: ['bgBlueBright', 'black'],
        warn: ['bgYellowBright', 'black'],
        error: ['bgRedBright', 'white'],
        fatal: ['bgRed', 'white'],
      },
    }
  }

  let handler: Handler
  if (utils.types.has(options.handler, 'type')) {
    if (options.handler.type === 'console') {
      handler = makeConsoleHandler()
    } else if (options.handler.type === 'debug') {
      handler = makeDebugHandler({label: options.label, ...options.handler})
    } else if (options.handler.type === 'file') {
      handler = makeFileHandler(options.handler)
      options.colors = undefined
    } else if (options.handler.type === 'rolling file') {
      handler = makeRollingFileHandler(options.handler)
      options.colors = undefined
    } else {
      throw new Error(`Unknown type of the handler "${(options.handler as any).type}"`)
    }
  } else if (utils.types.isFunction(options.handler, 'log')) {
    handler = options.handler
  } else {
    throw new Error('Handler have to implement "log" method or use one of the built-in handler names under "type" prop')
  }

  let consoleHandler: Handler
  if (options.console !== false) {
    consoleHandler = utils.types.isObject(options.console) ? options.console : makeConsoleHandler()
  } else {
    consoleHandler = handler
  }

  const format = options.format ?? defaultFormat
  const tags = {...options.tags}
  const masks = new Set(options.masks)

  return {
    isLogger: true,
    console: makePrinter({handler: consoleHandler, format, level: LogLevel.all, prelude: false}),
    ...makePrinter({...options, format, level, colors, handler, tags, masks}),
    tag(name, value) {
      tags[name] = value
    },
    mask(valueOrRegexp) {
      masks.add(valueOrRegexp)
    },
    extend(extendOptions?: ExtendOptions) {
      if (extendOptions) {
        if (!extendOptions.colors) {
          extendOptions.colors = extendOptions.colors ?? colors ?? false
        } else if (colors) {
          extendOptions.colors = {...colors, ...(extendOptions.colors as ColoringOptions)}
        }
        if (extendOptions.tags) {
          extendOptions.tags = {...tags, ...extendOptions.tags}
        }
        if (extendOptions.masks) {
          extendOptions.masks = new Set([...masks, ...extendOptions.masks])
        }
      }
      return makeLogger({
        ...options,
        format,
        tags,
        level,
        masks,
        console: consoleHandler,
        ...extendOptions,
        handler: forceInitHandler ? undefined : handler,
        extended: true,
      })
    },
    open() {
      if (!options.extended) (options.handler as Handler).open?.()
    },
    close() {
      if (!options.extended) (options.handler as Handler).close?.()
    },
  }
}

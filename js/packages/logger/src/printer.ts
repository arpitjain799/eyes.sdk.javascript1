import {type Handler} from './handler'
import {type ColoringOptions} from './format'
import {LogLevel} from './log-level'
import {format} from './format'

export type PrinterOptions = {
  handler: Handler
  format: typeof format
  prelude?: boolean
  label?: string
  tags?: Record<string, unknown>
  timestamp?: boolean
  level: number
  colors?: ColoringOptions
  masks?: string[]
}

export interface Printer {
  debug(...messages: any[]): void
  log(...messages: any[]): void
  info(...messages: any[]): void
  warn(...messages: any[]): void
  error(...messages: any[]): void
  fatal(...messages: any[]): void
  verbose(...messages: any[]): void
}

export function makePrinter({handler, format, level, ...defaults}: PrinterOptions): Printer {
  return {debug, log, info: log, warn, error, fatal, verbose: log}

  function debug(...messages: any[]) {
    if (level < LogLevel.debug) return
    const options = {...defaults, level: 'debug' as const}
    handler.log(format(messages, options))
  }
  function log(...messages: any[]) {
    if (level < LogLevel.info) return
    const options = {...defaults, level: 'info' as const}
    handler.log(format(messages, options))
  }
  function warn(...messages: any[]) {
    if (level < LogLevel.warn) return
    const options = {...defaults, level: 'warn' as const}
    if (handler.warn) handler.warn(format(messages, options))
    else handler.log(format(messages, options))
  }
  function error(...messages: any[]) {
    if (level < LogLevel.error) return
    const options = {...defaults, level: 'error' as const}
    if (handler.error) handler.error(format(messages, options))
    else handler.log(format(messages, options))
  }
  function fatal(...messages: any[]) {
    if (level < LogLevel.fatal) return
    const options = {...defaults, level: 'fatal' as const}
    if (handler.fatal) handler.fatal(format(messages, options))
    else if (handler.error) handler.error(format(messages, options))
    else handler.log(format(messages, options))
  }
}

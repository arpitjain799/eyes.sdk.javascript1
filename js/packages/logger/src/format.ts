import {type LogLevelName} from './log-level'
import {inspect} from 'util'
import * as utils from '@applitools/utils'
import chalk from 'chalk'

type ForegroundColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
  | 'grey'
  | 'blackBright'
  | 'redBright'
  | 'greenBright'
  | 'yellowBright'
  | 'blueBright'
  | 'magentaBright'
  | 'cyanBright'
  | 'whiteBright'

type BackgroundColor =
  | 'bgBlack'
  | 'bgRed'
  | 'bgGreen'
  | 'bgYellow'
  | 'bgBlue'
  | 'bgMagenta'
  | 'bgCyan'
  | 'bgWhite'
  | 'bgGray'
  | 'bgGrey'
  | 'bgBlackBright'
  | 'bgRedBright'
  | 'bgGreenBright'
  | 'bgYellowBright'
  | 'bgBlueBright'
  | 'bgMagentaBright'
  | 'bgCyanBright'
  | 'bgWhiteBright'

type Style = ForegroundColor | BackgroundColor

export type ColoringOptions = {
  timestamp?: Style | Style[]
  level?: {
    [key in LogLevelName]?: Style | Style[]
  }
  label?: Style | Style[]
  tags?: Style | Style[]
  message?: Style | Style[]
}

export type FormatOptions = {
  prelude?: boolean
  label?: string
  timestamp?: Date | boolean
  level?: LogLevelName
  tags?: Record<string, unknown>
  color?: Style | Style[]
  colors?: ColoringOptions
  masks?: Iterable<string | RegExp>
}

export function format(chunks: any[], options: FormatOptions = {}) {
  options.prelude ??= true
  options.timestamp ??= true
  options.level ??= 'info'
  const message = []
  if (options.prelude) {
    if (options.label) {
      const text = options.label.padEnd(10)
      const color = options.colors?.label
      message.push(color ? colorize(text, {color}) : `${text}|`)
    }
    if (options.timestamp) {
      const timestamp = options.timestamp === true ? new Date() : options.timestamp
      const text = timestamp.toISOString()
      const color = options.colors?.timestamp
      message.push(color ? colorize(text, {color}) : text)
    }
    if (options.level) {
      const text = options.level.toUpperCase().padEnd(5)
      const color = options.colors?.level?.[options.level]
      message.push(color ? colorize(` ${text} `, {color}) : `[${text}]`)
    }
    if (!utils.types.isEmpty(options.tags)) {
      const text = JSON.stringify(options.tags)
      const color = options.colors?.tags
      message.push(color ? colorize(text, {color}) : text)
    }
  }

  if (chunks && chunks.length > 0) {
    const color = options.colors?.message
    const regexps = options.masks && regexpify(options.masks)
    const text = chunks.map(chunk => {
      const text = utils.types.isString(chunk)
        ? colorize(chunk, {color})
        : inspect?.(chunk, {colors: !!options.colors, compact: 5, depth: 5})
      return regexps ? regexps.reduce((text, regexp) => text.replace(regexp, '***'), text) : text
    })
    message.push(text.join(' '))
  }

  return message.join(' ')
}

function colorize(string: string, {color}: {color?: Style | Style[]} = {}) {
  if (!color) return string
  if (!utils.types.isArray(color)) color = [color]
  return color.reduce<chalk.Chalk>((chalk, color) => chalk[color] ?? chalk, chalk)(string)
}

function regexpify(masks: Iterable<string | RegExp>): RegExp[] {
  const [strings, regexps] = Array.from(masks).reduce(
    ([strings, regexps], mask) => {
      if (utils.types.isString(mask)) strings.push(mask.replace(/[#-.]|[[-^]|[?|{}]/g, '\\$&'))
      else regexps.push(mask)
      return [strings, regexps]
    },
    [[] as string[], [] as RegExp[]],
  )
  if (strings.length > 0) {
    regexps.unshift(new RegExp(`(${strings.join('|')})`, 'g'))
  }
  return regexps
}

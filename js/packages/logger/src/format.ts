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
  masks?: string[]
}

export function format(
  chunks: any[],
  {prelude = true, label, timestamp = new Date(), level = 'info', tags, colors, masks}: FormatOptions = {},
) {
  const message = []
  if (prelude) {
    if (label) {
      const text = label.padEnd(10)
      const color = colors?.label
      message.push(color ? colorize(text, {color}) : `${text}|`)
    }
    if (timestamp) {
      timestamp = timestamp === true ? new Date() : timestamp
      const text = timestamp.toISOString()
      const color = colors?.timestamp
      message.push(color ? colorize(text, {color}) : text)
    }
    if (level) {
      const text = level.toUpperCase().padEnd(5)
      const color = colors?.level?.[level]
      message.push(color ? colorize(` ${text} `, {color}) : `[${text}]`)
    }
    if (!utils.types.isEmpty(tags)) {
      const text = JSON.stringify(tags)
      const color = colors?.tags
      message.push(color ? colorize(text, {color}) : text)
    }
  }

  if (chunks && chunks.length > 0) {
    const color = colors?.message
    const replacer = masks && masks.length > 0 ? new RegExp(`(${masks.join('|')})`, 'g') : null
    const strings = chunks.map(chunk => {
      const string = utils.types.isString(chunk)
        ? colorize(chunk, {color})
        : inspect?.(chunk, {colors: !!colors, compact: 5, depth: 5})
      return replacer ? string.replace(replacer, '***') : string
    })
    message.push(strings.join(' '))
  }

  return message.join(' ')
}

function colorize(string: string, {color}: {color?: Style | Style[]} = {}) {
  if (!color) return string
  if (!utils.types.isArray(color)) color = [color]
  return color.reduce<chalk.Chalk>((chalk, color) => chalk[color] ?? chalk, chalk)(string)
}

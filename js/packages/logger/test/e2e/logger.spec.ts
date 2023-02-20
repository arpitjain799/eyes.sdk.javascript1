import {makeLogger} from '../../src'
import * as fs from 'fs'
import * as path from 'path'
import * as utils from '@applitools/utils'
import assert from 'assert'
import chalk from 'chalk'
import debug from 'debug'

describe('logger', () => {
  it('level silent', () => {
    const logger = makeLogger({handler: {type: 'console'}, level: 'silent', timestamp: false})
    const output = track(() => {
      logger.log('info')
      logger.warn('warn')
      logger.error('error')
      logger.fatal('fatal')
    })

    assert.deepStrictEqual(output.stdout, [])
    assert.deepStrictEqual(output.stderr, [])
  })

  it('level fatal', () => {
    const logger = makeLogger({handler: {type: 'console'}, level: 'fatal', timestamp: false})
    const output = track(() => {
      logger.log('info')
      logger.warn('warn')
      logger.error('error')
      logger.fatal('fatal')
    })

    assert.deepStrictEqual(output.stdout, [])
    assert.deepStrictEqual(output.stderr, ['[FATAL] fatal\n'])
  })

  it('level error', () => {
    const logger = makeLogger({handler: {type: 'console'}, level: 'error', timestamp: false})
    const output = track(() => {
      logger.log('info')
      logger.warn('warn')
      logger.error('error')
      logger.fatal('fatal')
    })

    assert.deepStrictEqual(output.stdout, [])
    assert.deepStrictEqual(output.stderr, ['[ERROR] error\n', '[FATAL] fatal\n'])
  })

  it('level warn', () => {
    const logger = makeLogger({handler: {type: 'console'}, level: 'warn', timestamp: false})
    const output = track(() => {
      logger.log('info')
      logger.warn('warn')
      logger.error('error')
      logger.fatal('fatal')
    })

    assert.deepStrictEqual(output.stdout, [])
    assert.deepStrictEqual(output.stderr, ['[WARN ] warn\n', '[ERROR] error\n', '[FATAL] fatal\n'])
  })

  it('level info', () => {
    const logger = makeLogger({handler: {type: 'console'}, level: 'info', timestamp: false})
    const output = track(() => {
      logger.log('info')
      logger.warn('warn')
      logger.error('error')
      logger.fatal('fatal')
    })

    assert.deepStrictEqual(output.stdout, ['[INFO ] info\n'])
    assert.deepStrictEqual(output.stderr, ['[WARN ] warn\n', '[ERROR] error\n', '[FATAL] fatal\n'])
  })

  it('label', () => {
    const logger = makeLogger({handler: {type: 'console'}, level: 'info', label: 'TEST', timestamp: false})
    const output = track(() => {
      logger.log('info')
    })

    assert.deepStrictEqual(output.stdout, ['TEST      | [INFO ] info\n'])
  })

  it('tags', () => {
    const logger = makeLogger({handler: {type: 'console'}, level: 'info', tags: {tag: '@@@'}, timestamp: false})
    const output = track(() => {
      logger.log('info')
    })

    assert.deepStrictEqual(output.stdout, ['[INFO ] {"tag":"@@@"} info\n'])
  })

  it('colors', () => {
    const timestamp = new Date('2021-03-19T16:49:00.000Z') as any
    const tags = {applitools: true}
    const logger = makeLogger({
      handler: {type: 'console'},
      label: 'Applitools',
      timestamp,
      tags: tags,
      level: 'info',
      colors: true,
    })
    const output = track(() => {
      logger.log('info')
      logger.warn('warn')
      logger.error('error')
      logger.fatal('fatal')
    })

    const prelude = `${chalk.cyan('Applitools')} ${chalk.greenBright(timestamp.toISOString())}`

    assert.deepStrictEqual(output.stdout, [
      `${prelude} ${chalk.bgBlueBright.black(' INFO  ')} ${chalk.blueBright(JSON.stringify(tags))} info\n`,
    ])
    assert.deepStrictEqual(output.stderr, [
      `${prelude} ${chalk.bgYellowBright.black(' WARN  ')} ${chalk.blueBright(JSON.stringify(tags))} warn\n`,
      `${prelude} ${chalk.bgRedBright.white(' ERROR ')} ${chalk.blueBright(JSON.stringify(tags))} error\n`,
      `${prelude} ${chalk.bgRed.white(' FATAL ')} ${chalk.blueBright(JSON.stringify(tags))} fatal\n`,
    ])
  })

  it('masks', () => {
    const logger = makeLogger({handler: {type: 'console'}, level: 'info', masks: ['VerySecretValue'], timestamp: false})
    const output = track(() => {
      logger.log('secret = VerySecretValue')
    })

    assert.deepStrictEqual(output.stdout, ['[INFO ] secret = ***\n'])
  })

  it('handler file', async () => {
    const filename = path.resolve(__dirname, './test.log')
    const logger = makeLogger({
      handler: {type: 'file', filename},
      level: 'info',
      tags: {tag: '&&&'},
      timestamp: new Date('2021-03-19T16:49:00.000Z') as any,
    })

    logger.log('info')
    logger.warn('warn')
    logger.error('error')
    logger.fatal('fatal')
    await utils.general.sleep(100)
    logger.close()

    const output = fs.readFileSync(filename, {encoding: 'utf8'})

    fs.unlinkSync(filename)

    assert.strictEqual(
      output,
      '2021-03-19T16:49:00.000Z [INFO ] {"tag":"&&&"} info\n' +
        '2021-03-19T16:49:00.000Z [WARN ] {"tag":"&&&"} warn\n' +
        '2021-03-19T16:49:00.000Z [ERROR] {"tag":"&&&"} error\n' +
        '2021-03-19T16:49:00.000Z [FATAL] {"tag":"&&&"} fatal\n',
    )
  })

  it('handler rolling file', async () => {
    const dirname = path.resolve(__dirname, 'test-logs')
    const logger = makeLogger({
      handler: {type: 'rolling file', dirname, name: 'test', maxFileLength: 100},
      level: 'info',
      tags: {tag: '&&&'},
      timestamp: new Date('2021-03-19T16:49:00.000Z') as any,
    })

    logger.log('info')
    await utils.general.sleep(10)
    logger.warn('warn')
    await utils.general.sleep(10)
    logger.error('error')
    await utils.general.sleep(10)
    logger.fatal('fatal')
    await utils.general.sleep(10)
    logger.close()

    const filenames = fs.readdirSync(dirname)

    const expected = [
      '2021-03-19T16:49:00.000Z [INFO ] {"tag":"&&&"} info\n',
      '2021-03-19T16:49:00.000Z [WARN ] {"tag":"&&&"} warn\n',
      '2021-03-19T16:49:00.000Z [ERROR] {"tag":"&&&"} error\n',
      '2021-03-19T16:49:00.000Z [FATAL] {"tag":"&&&"} fatal\n',
    ]

    filenames.forEach((filename, index) => {
      const output = fs.readFileSync(path.resolve(dirname, filename), {encoding: 'utf8'})
      assert.strictEqual(output, expected[index])
    })

    await fs.promises.rmdir(dirname, {recursive: true})
  })

  it('handler debug', async () => {
    process.env.DEBUG = 'appli:*'
    debug.enable(process.env.DEBUG)
    Object.assign((debug as any).inspectOpts, {colors: false, hideDate: true})

    const logger = makeLogger({label: 'label WITH SpAcEs AND uppeR CAseS', colors: false, timestamp: false})
    const loggerExtended = logger.extend({label: 'label2', tags: {tag: '@@@'}})
    const output = track(() => {
      logger.log('log')
      logger.warn('warn')
      logger.error('error')
      logger.fatal('fatal')
      loggerExtended.log('log2')
      loggerExtended.warn('warn2')
      loggerExtended.error('error2')
      loggerExtended.fatal('fatal2')
    })

    assert.deepStrictEqual(output.stderr, [
      'appli:label-with-spaces-and-upper-cases [INFO ] log\n',
      'appli:label-with-spaces-and-upper-cases [WARN ] warn\n',
      'appli:label-with-spaces-and-upper-cases [ERROR] error\n',
      'appli:label-with-spaces-and-upper-cases [FATAL] fatal\n',
      'appli:label2 [INFO ] {"tag":"@@@"} log2\n',
      'appli:label2 [WARN ] {"tag":"@@@"} warn2\n',
      'appli:label2 [ERROR] {"tag":"@@@"} error2\n',
      'appli:label2 [FATAL] {"tag":"@@@"} fatal2\n',
    ])
  })

  it('handler custom', () => {
    const output = [] as string[]
    const handler = {log: (message: string) => output.push(message)}
    const logger = makeLogger({handler, level: 'info', timestamp: new Date('2021-03-19T16:49:00.000Z') as any})

    logger.log('info')
    logger.warn('warn')
    logger.error('error')
    logger.fatal('fatal')

    assert.deepStrictEqual(output, [
      '2021-03-19T16:49:00.000Z [INFO ] info',
      '2021-03-19T16:49:00.000Z [WARN ] warn',
      '2021-03-19T16:49:00.000Z [ERROR] error',
      '2021-03-19T16:49:00.000Z [FATAL] fatal',
    ])
  })

  it('format', () => {
    const output = [] as string[]
    const format = (chunks: any[], options?: Record<string, any>) => ({chunks, ...options} as any)
    const handler = {log: (message: string) => output.push(message)}
    const timestamp = new Date('2021-03-19T16:49:00.000Z') as any
    const label = 'Test'
    const logger = makeLogger({handler, format, level: 'info', label, timestamp})

    logger.log('info')
    logger.warn('warn')
    logger.error('error')
    logger.fatal('fatal')

    assert.deepStrictEqual(output, [
      {chunks: ['info'], label, level: 'info', tags: undefined, timestamp, colors: undefined},
      {chunks: ['warn'], label, level: 'warn', tags: undefined, timestamp, colors: undefined},
      {chunks: ['error'], label, level: 'error', tags: undefined, timestamp, colors: undefined},
      {chunks: ['fatal'], label, level: 'fatal', tags: undefined, timestamp, colors: undefined},
    ])
  })

  it('console', () => {
    const logger = makeLogger({level: 'silent'})
    const output = track(() => {
      logger.console.log('info')
      logger.console.warn('warn')
      logger.console.error('error')
      logger.console.fatal('fatal')
    })

    assert.deepStrictEqual(output.stdout, ['info\n'])
    assert.deepStrictEqual(output.stderr, ['warn\n', 'error\n', 'fatal\n'])
  })

  it('console custom', () => {
    const output = [] as any[]
    const handler = {log: (message: string) => output.push(message)}
    const logger = makeLogger({handler, level: 'silent', console: false})
    const {stdout, stderr} = track(() => {
      logger.console.log('info')
      logger.console.warn('warn')
      logger.console.error('error')
      logger.console.fatal('fatal')
    })

    assert.deepStrictEqual(stdout, [])
    assert.deepStrictEqual(stderr, [])
    assert.deepStrictEqual(output, ['info', 'warn', 'error', 'fatal'])
  })

  function track(action: () => void) {
    const output = {stdout: [] as string[], stderr: [] as string[]}
    const originalStdoutWrite = process.stdout.write.bind(process.stdout)
    const originalStderrWrite = process.stderr.write.bind(process.stderr)
    process.stdout.write = (chunk, ...rest: any[]) => (
      output.stdout.push(chunk as string), originalStdoutWrite(chunk, ...rest)
    )
    process.stderr.write = (chunk, ...rest: any[]) => (
      output.stderr.push(chunk as string), originalStderrWrite(chunk, ...rest)
    )
    action()
    process.stdout.write = originalStdoutWrite
    process.stderr.write = originalStderrWrite
    return output
  }
})

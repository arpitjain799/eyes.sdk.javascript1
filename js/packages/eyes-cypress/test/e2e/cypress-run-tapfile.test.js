'use strict'
const {expect} = require('chai')
const path = require('path')
const {init, exec, updateApplitoolsConfig} = require('../util/pexec')
const runInEnv = init(before, after)
const {promisify: p} = require('util')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const readFile = p(fs.readFile)
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-tapfile'

async function runCypress(pluginsFile, testFile = 'helloworld.js') {
  return (
    await runInEnv(
      `npx cypress@9 run --headless --config testFiles=${testFile},integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/${pluginsFile},supportFile=cypress/support/index-run.js`,
      {
        maxBuffer: 10000000,
        cwd: targetTestAppPath,
      },
    )
  ).stdout
}

const readTapFile = async tapFilePath => {
  return await readFile(tapFilePath, 'utf8')
}

describe('tap file (parallel-test)', () => {
  beforeEach(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it(`supports creating '.tap' file from browser hooks`, async () => {
    const helloWorldAppData = {
      appName: 'Hello World!',
      testName: 'My first JavaScript test!',
    }
    const outputLine = `[PASSED TEST] Test: '${helloWorldAppData.testName}', Application: '${helloWorldAppData.appName}'`
    const config = {...applitoolsConfig, tapDirPath: './'}
    updateApplitoolsConfig(config, targetTestAppPath)
    const [err] = await presult(runCypress('index-run.js', 'helloworld.js'))
    expect(err).to.be.undefined
    const dirCont = fs.readdirSync(path.resolve(__dirname, '../..', targetTestAppPath))
    const files = dirCont.filter(function (elm) {
      return elm.match(/.*\.(tap?)/gi)
    })
    expect(files.length).to.equal(1, `Created ${files.length} .tap file(s)`)
    const tapFilePath = path.resolve(targetTestAppPath, files[0])
    const tapFileContent = await readTapFile(tapFilePath)
    expect(tapFileContent).to.include(outputLine, '.tap file content match')
  })

  it(`supports creating '.tap' file from global hooks`, async () => {
    const helloWorldAppData = {
      appName: 'Hello World!',
      testName: 'My first JavaScript test!',
    }
    const outputLine = `[PASSED TEST] Test: '${helloWorldAppData.testName}', Application: '${helloWorldAppData.appName}'`
    const config = {...applitoolsConfig, tapDirPath: './'}
    updateApplitoolsConfig(config, targetTestAppPath)
    const [err] = await presult(runCypress('index-global-hooks-overrides-tap-dir.js', 'helloworld.js'))
    expect(err).to.be.undefined
    const dirCont = fs.readdirSync(targetTestAppPath)
    const files = dirCont.filter(function (elm) {
      return elm.match(/.*\.(tap?)/gi)
    })
    expect(files.length).to.equal(1, `Created ${files.length} .tap file(s)`)
    const tapFilePath = path.resolve(targetTestAppPath, files[0])
    const tapFileContent = await readTapFile(tapFilePath)
    expect(tapFileContent).to.include(outputLine, '.tap file content match')
  })
})

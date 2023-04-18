'use strict'
const path = require('path')
const {updateApplitoolsConfigFile, init} = require('../util/pexec')
const exec = init()
const {presult} = require('@applitools/functional-commons')
const {getTestInfo} = require('@applitools/test-utils')
const {expect} = require('chai')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-checkSettings-globalConfig'

async function runCypress(pluginsFile, testFile) {
  return (
    await exec(
      `npx cypress@9 run --headless --config testFiles=${testFile},integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/${pluginsFile},supportFile=cypress/support/index-run.js`,
      {
        maxBuffer: 10000000,
        cwd: targetTestAppPath,
      },
    )
  ).stdout
}
async function getInfo(stdout) {
  debugger
  const results = stdout
    .substring(stdout.indexOf('@@START@@') + '@@START@@'.length, stdout.indexOf('@@END@@'))
    .replace('Summary results: ', '')

  const summary = JSON.parse(results)
  return getTestInfo(summary[0].result, process.env.APPLITOOLS_API_KEY)
}

function checkProps(info) {
  expect(info.actualAppOutput[0].accessibilityStatus.level).to.eq('AAA')
  expect(info.actualAppOutput[0].accessibilityStatus.version).to.eq('WCAG_2_0')
  expect(info.actualAppOutput[0].image.hasDom).to.eq(true)
  expect(info.actualAppOutput[0].imageMatchSettings.enablePatterns).to.eq(true)
  expect(info.actualAppOutput[0].imageMatchSettings.useDom).to.eq(true)
  expect(info.actualAppOutput[0].imageMatchSettings.ignoreCaret).to.eq(true)
  expect(info.actualAppOutput[0].imageMatchSettings.ignoreDisplacements).to.eq(true)
  expect(info.actualAppOutput[0].imageMatchSettings.matchLevel).to.eq('Layout2')
  expect(info.startInfo.environment.hostingApp).to.contain('Firefox')
  expect(info.startInfo.environment.displaySize).to.deep.equal({width: 500, height: 500})
  expect(info.startInfo.batchInfo.name).to.eq('CheckSettings with global config')
  expect(info.startInfo.batchInfo.batchSequenceName).to.eq('CheckSettings - global config')
  expect(info.startInfo.batchInfo.notifyOnCompletion).to.eq(true)
}

describe('works with checkSettings in config file (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    // await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('checkSettings works from applitools.config file', async () => {
    await exec(
      updateApplitoolsConfigFile(
        path.resolve(__dirname, '../fixtures/testApp/happy-config/checkSettingsFromGlobal.config.js'),
      ),
      {
        cwd: targetTestAppPath,
      },
    )
    try {
      const [_err, stdout] = await presult(
        runCypress('get-test-results-for-checkSettings.js', 'checkSettingsInGlobalConfig.js'),
      )

      const info = await getInfo(stdout)
      checkProps(info)
    } catch (ex) {
      console.error('Error during test!', ex)
      throw ex
    }
  })
})

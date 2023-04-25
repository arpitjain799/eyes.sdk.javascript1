'use strict'
const {expect} = require('chai')
const {init, exec, updateApplitoolsConfig} = require('../util/pexec')
const runInEnv = init(before, after)

const {presult} = require('@applitools/functional-commons')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-make-sure-appliConfFile-stays-intact'

async function runCypress(pluginsFile, testFile = 'appliConfFile.js') {
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

describe('make sure appliConfFile stays intact (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('appliConfFile, browserInfo stays intact', async () => {
    const config = {
      browser: [{width: 650, height: 800, name: 'firefox'}],
      failCypressOnDiff: false,
    }
    updateApplitoolsConfig(config, targetTestAppPath)
    const [err, v] = await presult(runCypress('get-test-results.js', 'appliConfFile.js'))
    expect(err).to.be.undefined
    // console.log(v);
    expect(v).to.contain(`first test - config file - browsers: {\"width\":650,\"height\":800,\"name\":\"firefox\"}`)
    expect(v).to.contain(`second test - config file - browsers: {\"width\":650,\"height\":800,\"name\":\"firefox\"}`)
  })
})

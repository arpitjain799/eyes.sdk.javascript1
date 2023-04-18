'use strict'
const {expect} = require('chai')
const {init, updateApplitoolsConfig} = require('../util/pexec')
const exec = init()
const {presult} = require('@applitools/functional-commons')
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-getAllTestResults'

async function runCypress(pluginsFile, testFile = 'getAllTestResults.js') {
  return (
    await exec(
      `npx cypress@6.5.0 run --headless --config testFiles=${testFile},integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/${pluginsFile},supportFile=cypress/support/index-run.js`,
      {
        maxBuffer: 10000000,
        cwd: targetTestAppPath,
      },
    )
  ).stdout
}

describe('getAllTestResults (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('return test results for all managers', async () => {
    const [err, v] = await presult(runCypress('get-test-results.js', 'getAllTestResults.js'))
    debugger
    expect(err).to.be.undefined
    expect(v).to.contain('This is the first test')
    expect(v).to.contain('This is the second test')
  })

  it('return test results for all managers without duplicates', async () => {
    // removeDuplicateTests opted into in test/fixtures/testApp/applitools.config.js
    const [err, v] = await presult(runCypress('get-test-results.js', 'getAllTestResultsWithDuplicates.js'))
    expect(err).to.be.undefined
    expect(v).to.contain('This is the first test')
    expect(v).to.contain('This is the second test')
    expect(v).to.contain('passed=2')
  })

  it('delete test results', async () => {
    const config = {...applitoolsConfig, showLogs: true}
    await exec(updateApplitoolsConfig(config), {
      cwd: targetTestAppPath,
    })

    const [err, v] = await presult(runCypress('get-test-results.js', 'deleteTestResults.js'))
    expect(err).to.be.undefined
    expect(v).to.contain('Core.deleteTest')
  })
})

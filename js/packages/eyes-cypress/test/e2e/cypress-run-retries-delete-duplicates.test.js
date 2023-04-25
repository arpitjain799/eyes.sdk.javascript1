'use strict'
const {expect} = require('chai')
const {presult} = require('@applitools/functional-commons')
const {init, exec} = require('../util/pexec')
const runInEnv = init(before, after)

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-retries'

async function runCypress(pluginsFile, testFile = 'getAllTestResults.js (parallel-test)') {
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

// skip this test for now as it's flaky on CI
describe('Retries', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('remove duplicate tests on retry', async () => {
    const [err, v] = await presult(runCypress('get-test-results.js', 'retries.js'))
    console.log(v)
    expect(err).to.be.undefined
  })
})

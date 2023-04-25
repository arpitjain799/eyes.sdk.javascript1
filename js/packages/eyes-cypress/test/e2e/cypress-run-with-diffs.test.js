'use strict'
const {init, exec} = require('../util/pexec')
const runInEnv = init(before, after)
const {presult} = require('@applitools/functional-commons')
const {expect} = require('chai')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-run-wth-diffs'

async function runCypress(pluginsFile, testFile) {
  return (
    await runInEnv(
      `npx cypress@9.7.0 run --headless --config testFiles=${testFile},integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/${pluginsFile},supportFile=cypress/support/index-run.js`,
      {
        maxBuffer: 10000000,
        cwd: targetTestAppPath,
      },
    )
  ).stdout
}

describe('works for diffs with global hooks (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works for diffs with global hooks', async () => {
    const [err, _v] = await presult(runCypress('index-run.js', 'helloworldDiffs.js'))
    expect(err.stdout).to.includes('Eyes-Cypress detected diffs')
  })
})

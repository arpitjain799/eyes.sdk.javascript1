'use strict'
const {expect} = require('chai')
const path = require('path')
const {exec, init, updateCypressJSONConfigFile} = require('../util/pexec')
const runInEnv = init()
const cypressConfig = require('../fixtures/testApp/cypress')
const {presult} = require('@applitools/functional-commons')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-global-hooks')

async function runCypress(testFile, cypressVersion = '6.5.0') {
  return (
    await runInEnv(
      `npx cypress@${cypressVersion} run --headless --config testFiles=${testFile},integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js`,
      {
        maxBuffer: 10000000,
        cwd: targetTestAppPath,
      },
    )
  ).stdout
}

describe('global hooks', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works with experimentalRunEvents flag', async () => {
    const config = {...cypressConfig, experimentalRunEvents: true}
    updateCypressJSONConfigFile(config, targetTestAppPath)
    const [err, _stdout] = await presult(runCypress('fail.js'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('does not fail without experimentalRunEvents flag', async () => {
    const config = {...cypressConfig, experimentalRunEvents: false}
    updateCypressJSONConfigFile(config, targetTestAppPath)
    const [err, _stdout] = await presult(runCypress('fail.js'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('works with cypress version 6.0.0, < 6.2.0 no global hooks available', async () => {
    const [err, _stdout] = await presult(runCypress('fail.js', '6.0.0'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('works with cypress 6.7.0 or greater without flag', async () => {
    const [err, _stdout] = await presult(runCypress('fail.js', '9'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })
})

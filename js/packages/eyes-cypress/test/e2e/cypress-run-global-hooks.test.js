'use strict'
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const cypressConfig = require('../fixtures/testApp/cypress')
const {presult} = require('@applitools/functional-commons')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-global-hooks')

async function runCypress(testFile, cypressVersion = '6.5.0') {
  return (
    await pexec(
      `npx cypress@${cypressVersion} run --headless --config testFiles=${testFile},integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js`,
      {
        maxBuffer: 10000000,
      },
    )
  ).stdout
}

describe('global hooks', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    process.chdir(targetTestAppPath)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works with experimentalRunEvents flag', async () => {
    const config = {...cypressConfig, experimentalRunEvents: true}
    fs.writeFileSync(`${targetTestAppPath}/cypress.json`, JSON.stringify(config, 2, null))
    const [err, _stdout] = await presult(runCypress('fail.js'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('does not fail without experimentalRunEvents flag', async () => {
    const config = {...cypressConfig, experimentalRunEvents: false}
    fs.writeFileSync(`${targetTestAppPath}/cypress.json`, JSON.stringify(config, 2, null))
    const [err, _stdout] = await presult(runCypress('fail.js'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('works with cypress version 4 (< 6.2.0 no global hooks available)', async () => {
    const [err, _stdout] = await presult(runCypress('fail.js', '4'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('works with cypress 6.7.0 or greater without flag', async () => {
    const [err, _stdout] = await presult(runCypress('fail.js', '9'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })
})

'use strict'
const {init, exec} = require('../util/pexec')
const runInEnv = init(before, after)
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const {expect} = require('chai')
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-visualGridOptions-globalConfig'

async function runCypress(pluginsFile, testFile) {
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

describe('works with visualGridOptions from global config (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works with visualGridOptions from applitools.config file', async () => {
    const config = {...applitoolsConfig, visualGridOptions: {adjustDocumentHeight: true}}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    const [err, _stdout] = await presult(runCypress('index-run.js', 'visualGridOptionsGlobalConfig.js'))
    try {
      console.log(err)
      expect(err).to.be.undefined
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})

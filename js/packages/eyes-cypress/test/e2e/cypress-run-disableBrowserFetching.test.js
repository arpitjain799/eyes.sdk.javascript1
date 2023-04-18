'use strict'
const {init, updateApplitoolsConfig, updateConfigFile} = require('../util/pexec')
const path = require('path')
const exec = init()

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-disableBrowserFetching'

async function runCypress() {
  return (
    await exec(`npx cypress@latest run`, {
      cwd: targetTestAppPath,
      maxBuffer: 10000000,
    })
  ).stdout
}

describe('disableBrowserFetching (parallel-test)', () => {
  beforeEach(async () => {
    await exec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
    const applitoolsConfig = require(path.resolve(targetTestAppPath, `./applitools.config.js`))
    applitoolsConfig.disableBrowserFetching = true
    await exec(updateApplitoolsConfig(applitoolsConfig), {
      cwd: targetTestAppPath,
    })
  })
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    await exec(`rm ${targetTestAppPath}/cypress.json`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works for disableBrowserFetching.js', async () => {
    try {
      await updateConfigFile(targetTestAppPath, 'index-run.js', 'disableBrowserFetching.js')
      await runCypress()
    } catch (ex) {
      console.error('Error during test!', ex)
      throw ex
    }
  })
})

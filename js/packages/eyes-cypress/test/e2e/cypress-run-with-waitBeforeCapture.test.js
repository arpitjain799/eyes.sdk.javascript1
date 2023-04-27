'use strict'
const {updateApplitoolsConfig, init, exec} = require('../util/pexec')
const runInEnv = init(before, after)
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-waitBeforeCapture'

describe('works with waitBeforeCapture (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('waitBeforeCapture works from applitools.config file', async () => {
    const config = {...applitoolsConfig, waitBeforeCapture: 2000}
    updateApplitoolsConfig(config, targetTestAppPath)
    try {
      await runInEnv(
        'npx cypress@9 run --config testFiles=waitBeforeCaptureConfigFile.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
        {
          maxBuffer: 10000000,
          cwd: targetTestAppPath,
        },
      )
    } catch (ex) {
      console.error('Error during test!', ex)
      throw ex
    }
  })
})

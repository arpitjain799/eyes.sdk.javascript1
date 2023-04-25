'use strict'
const {updateApplitoolsConfig, init, exec} = require('../util/pexec')
const runInEnv = init(before, after)
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-batchId-property'

describe('handle batchId property (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ./test/fixtures/testApp/. ${targetTestAppPath}`)
  })
  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })
  it('works with batchId from env var with global hooks (parallel)', async () => {
    try {
      await runInEnv(
        'npx cypress@9 run --headless --config testFiles=batchIdProperty.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
        {
          maxBuffer: 10000000,
          cwd: targetTestAppPath,
          env: {
            APPLITOOLS_BATCH_ID: 'batchId1234',
          },
        },
      )
    } catch (ex) {
      console.error('Error during test!', ex)
      throw ex
    } finally {
      delete process.env.APPLITOOLS_BATCH_ID
    }
  })
  it('works with batchId from config file with global hooks', async () => {
    const config = {...applitoolsConfig, batchId: 'batchId123456'}
    updateApplitoolsConfig(config, targetTestAppPath)
    try {
      await runInEnv(
        'npx cypress@9 run --headless --config testFiles=batchIdProperty.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
        {
          maxBuffer: 10000000,
          cwd: targetTestAppPath,
        },
      )
    } catch (ex) {
      console.error('Error during test!', ex)
      throw ex
    } finally {
      delete process.env.APPLITOOLS_BATCH_ID
    }
  })
})

'use strict'
const {init, exec} = require('../util/pexec')
const runInEnv = init(before, after)
const {expect} = require('chai')
const {msgText} = require('../../dist/plugin/concurrencyMsg').default
const concurrencyMsg = msgText.substr(0, 100)

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-other'

describe('eyes configurations (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works with disabled eyes', async () => {
    try {
      const {stdout} = await runInEnv(
        'npx cypress@9 run --headless --headless --spec cypress/integration-play/iframe.js --config integrationFolder=cypress/integration-play,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
        {
          maxBuffer: 10000000,
          cwd: targetTestAppPath,
          env: {
            APPLITOOLS_IS_DISABLED: '1',
          },
        },
      )

      expect(stdout, 'cypress ran with eyes disabled but concurrency msg is shown').to.not.have.string(concurrencyMsg)
    } catch (ex) {
      console.error('Error during test!', ex)
      throw ex
    }
  })

  it('does not fail Cypress test if failCypressOnDiff flag is false', async () => {
    try {
      await runInEnv(
        'npx cypress@9 run --headless --headless --spec cypress/integration-play/always-fail.js --config integrationFolder=cypress/integration-play,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
        {
          maxBuffer: 10000000,
          cwd: targetTestAppPath,
          env: {
            APPLITOOLS_FAIL_CYPRESS_ON_DIFF: false,
          },
        },
      )
    } catch (ex) {
      console.error(
        'Test Failed even though failCypressOnDiff flag is false, If this is the first time u ran this test then u need to set up an invalid baseline for it.',
        ex,
      )
      throw ex
    }
  })
})

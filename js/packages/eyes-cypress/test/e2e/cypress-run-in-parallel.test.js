'use strict'
const {exec, init} = require('../util/pexec')
const runInEnv = init()

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-parallel-run'

describe('parallel run (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works for parallel cypress runs (parallel-test)', async () => {
    try {
      const runs = []
      runs.push(
        runInEnv(
          'npx cypress@9 run --headless --config testFiles=parallel-run-1.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
          {
            maxBuffer: 10000000,
            timeout: 60000,
            cwd: targetTestAppPath,
          },
        ),
      )
      runs.push(
        runInEnv(
          'xvfb-run -a npx cypress@9 run --headless --config testFiles=parallel-run-2.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
          {
            maxBuffer: 10000000,
            timeout: 60000,
            cwd: targetTestAppPath,
          },
        ),
      )
      await Promise.all(runs)
    } catch (ex) {
      console.error('Error during test!', ex)
      throw ex
    }
  })
})

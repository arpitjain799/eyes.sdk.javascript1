'use strict'
const {init, exec} = require('../util/pexec')
const runInEnv = init(before, after)

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-region-in-shadow-dom'

describe('region in shadow dom (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works for region-in-shadow-dom.js', async () => {
    try {
      await runInEnv(
        'npx cypress@9 run --headless --config testFiles=region-in-shadow-dom.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
        {
          maxBuffer: 10000000,
          cwd: targetTestAppPath,
        },
      )
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})

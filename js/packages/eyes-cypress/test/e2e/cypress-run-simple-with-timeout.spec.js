'use strict'
const path = require('path')
const {init, exec} = require('../util/pexec')
const runInEnv = init(before, after)

const {testServerInProcess} = require('@applitools/test-server')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-simple-with-timeout'

describe('simple with middleware (parallel-test)', () => {
  let closeServer
  before(async () => {
    const staticPath = path.resolve(__dirname, '../fixtures')
    const server = await testServerInProcess({
      port: 5555,
      staticPath,
      middlewares: ['slow'],
    })
    closeServer = server.close
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    try {
      await exec(`rm -rf ${targetTestAppPath}`)
    } finally {
      await closeServer()
    }
  })

  it('works for simple.js', async () => {
    try {
      await runInEnv(
        'npx cypress@9 run --headless --config testFiles=simple.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
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

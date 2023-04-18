'use strict'
const path = require('path')
const {init} = require('../util/pexec')
const exec = init()

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-chrome-emulation'

describe('chrome emulation (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works for chrome emulation', async () => {
    try {
      await exec(
        'npx cypress@9 run --headless --config testFiles=chromeEmulation.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
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

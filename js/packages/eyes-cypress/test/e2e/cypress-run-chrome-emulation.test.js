'use strict'
const path = require('path')
const {pexec} = require('../util/pexec')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-chrome-emulation'

describe('chrome emulation (parallel-test)', () => {
  before(async () => {
    await pexec(`rm -rf ${targetTestAppPath}`)
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await pexec(`rm -rf ${targetTestAppPath}`)
  })

  it('works for chrome emulation', async () => {
    try {
      await pexec(
        'npx cypress@6.5.0 run --headless --config testFiles=chromeEmulation.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
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

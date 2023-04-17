'use strict'
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-waitBeforeCapture')

describe('works with waitBeforeCapture', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    process.chdir(targetTestAppPath)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('waitBeforeCapture works from applitools.config file', async () => {
    const config = {...applitoolsConfig, waitBeforeCapture: 2000}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    try {
      await pexec(
        'npx cypress@6.5.0 run --config testFiles=waitBeforeCaptureConfigFile.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
        {
          maxBuffer: 10000000,
        },
      )
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})

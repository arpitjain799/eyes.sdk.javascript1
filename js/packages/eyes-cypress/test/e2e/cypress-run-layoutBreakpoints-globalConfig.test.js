'use strict'
const {init, exec, updateApplitoolsConfig} = require('../util/pexec')
const runInEnv = init(before, after)
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-layoutBreakpoints-globalConfig'

describe('works with layoutbreakpoing in global config (parallel-test)', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('layoutbreakpoints works from applitools.config file', async () => {
    const config = {...applitoolsConfig, layoutBreakpoints: [500, 1000]}
    updateApplitoolsConfig(config, targetTestAppPath)
    try {
      await runInEnv(
        'npx cypress@9 run --config testFiles=layoutBreakpointsGlobalConfig.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
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

'use strict'
const {expect} = require('chai')
const {exec, init, updateConfigFile} = require('../util/pexec')
const runInEnv = init()
const {presult} = require('@applitools/functional-commons')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-global-hooks-overrides-config-file'

async function runCypress() {
  return (
    await runInEnv(`npx cypress@latest run`, {
      maxBuffer: 10000000,
      cwd: targetTestAppPath,
    })
  ).stdout
}

describe('global hooks override (parallel-test)', () => {
  beforeEach(async () => {
    await exec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    await exec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}/cypress.config.js`)
    await exec(`rm ${targetTestAppPath}/cypress.json`)
  })

  it('supports running *sync* user defined global hooks', async () => {
    updateConfigFile(targetTestAppPath, 'index-global-hooks-overrides-sync.js', 'global-hooks-overrides.js')
    const [err, output] = await presult(runCypress())
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ before:run @@@')
    expect(output).to.contain('@@@ after:run @@@')
  })

  it('supports running *async* user defined global hooks', async () => {
    updateConfigFile(targetTestAppPath, 'index-global-hooks-overrides-async.js', 'global-hooks-overrides.js')
    const [err, output] = await presult(runCypress())
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ before:run @@@')
    expect(output).to.contain('@@@ after:run @@@')
  })

  it('supports running user defined global hooks, when user throws error on before', async () => {
    updateConfigFile(targetTestAppPath, 'index-global-hooks-overrides-error-before.js', 'global-hooks-overrides.js')
    const [err] = await presult(runCypress())
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('@@@ before:run error @@@')
    expect(err.stdout).not.to.contain('@@@ after:run @@@')
  })

  it('supports running user defined global hooks, when user throws error on after', async () => {
    updateConfigFile(targetTestAppPath, 'index-global-hooks-overrides-error-after.js', 'global-hooks-overrides.js')
    const [err] = await presult(runCypress('index-global-hooks-overrides-error-after.js'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('@@@ before:run @@@')
    expect(err.stdout).to.contain('@@@ after:run error @@@')
  })

  it('supports running user defined global hooks when only 1 hook is defined', async () => {
    updateConfigFile(targetTestAppPath, 'index-global-hooks-overrides-only-after.js', 'helloworld.js')
    const [err, output] = await presult(runCypress())
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ after:run @@@')
  })
})

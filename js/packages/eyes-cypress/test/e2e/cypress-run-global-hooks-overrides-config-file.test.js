'use strict'
const {expect} = require('chai')
const {exec, init, updateConfigFile, updateGlobalHooks} = require('../util/pexec')
const runInEnv = init()
const fs = require('fs')
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

describe('global hooks override in cypress.config.js file (parallel-test)', () => {
  beforeEach(async () => {
    fs.copyFileSync(
      `${__dirname}/../fixtures/cypressConfig-global-hooks-overrides-config-file.js`,
      `${targetTestAppPath}/cypress.config.js`,
    )
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

  it('supports running user defined global hooks from cypress.config.js file', async () => {
    updateConfigFile(targetTestAppPath, 'index-run.js', 'global-hooks-overrides.js')
    const globalHooks = `setupNodeEvents(on, config) {
      on('before:run', () => {
      console.log('@@@ before:run @@@');
      return null;
    });

    on('after:run', () => {
      console.log('@@@ after:run @@@');
      return null;
    });`
    updateGlobalHooks(globalHooks, targetTestAppPath)
    const [err, output] = await presult(runCypress())
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ before:run @@@')
    expect(output).to.contain('@@@ after:run @@@')
  })
})

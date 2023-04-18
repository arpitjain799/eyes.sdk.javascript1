'use strict'
const {expect} = require('chai')
const path = require('path')
const {init, updateCypressConfigFile, updateConfigFile, updateCypressConfig} = require('../util/pexec')
const exec = init()
const {presult} = require('@applitools/functional-commons')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-global-hooks-overrides-config-file-with-eyes-plugin'

let latestCypressVersion = null

async function runCypress() {
  if (latestCypressVersion === null) {
    latestCypressVersion = (await exec('npm view cypress version')).stdout.trim()
  }
  return (
    await exec(`npx cypress@${latestCypressVersion} run`, {
      maxBuffer: 10000000,
      cwd: targetTestAppPath,
    })
  ).stdout
}

async function updateGlobalHooks(globalHooks) {
  let configContent = require('fs').readFileSync(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8')
  const content = configContent.replace(/setupNodeEvents\(on, config\) {/g, globalHooks)
  await exec(updateCypressConfig(content), {
    cwd: targetTestAppPath,
  })
}

describe('global hooks override in cypress.config.js file using eyes-plugin', () => {
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    await exec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}/cypress.config.js`)
    await exec(`rm ${targetTestAppPath}/cypress.json`)
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  beforeEach(async () => {
    await exec(
      updateCypressConfigFile(
        path.resolve(__dirname, '../fixtures/cypressConfig-global-hooks-overrides-config-file-with-eyes-plugin.js'),
      ),
      {
        cwd: targetTestAppPath,
      },
    )
  })

  it('supports running user defined global hooks', async () => {
    await updateConfigFile(targetTestAppPath, 'index-run.js', 'global-hooks-overrides.js')
    const globalHooks = `setupNodeEvents(on, config) {
    on('before:run', () => {
      console.log('@@@ before:run @@@');
    });

    on('after:run', () => {
      console.log('@@@ after:run @@@');
    });`
    await updateGlobalHooks(globalHooks)
    const [err, output] = await presult(runCypress())
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ before:run @@@')
    expect(output).to.contain('@@@ after:run @@@')
  })

  it('supports running user defined global hooks, when user throws error on before', async () => {
    await updateConfigFile(targetTestAppPath, 'index-run.js', 'global-hooks-overrides.js')
    const globalHooks = `setupNodeEvents(on, config) {
    on('before:run', () => {
      throw new Error('@@@ before:run error @@@');
      console.log('@@@ before:run @@@');
    });
    on('after:run', () => {
      console.log('@@@ after:run @@@');
    });`
    await updateGlobalHooks(globalHooks)
    const [err] = await presult(runCypress())
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('@@@ before:run error @@@')
    expect(err.stdout).not.to.contain('@@@ after:run @@@')
  })

  it('supports running user defined global hooks, when user throws error on after', async () => {
    await updateConfigFile(targetTestAppPath, 'index-run.js', 'global-hooks-overrides.js')
    const globalHooks = `setupNodeEvents(on, config) {
    on('before:run', () => {
      console.log('@@@ before:run @@@');
    });
    on('after:run', () => {
      throw new Error('@@@ after:run error @@@');
      console.log('@@@ after:run @@@');
    });`
    await updateGlobalHooks(globalHooks)
    const [err] = await presult(runCypress('index-global-hooks-overrides-error-after.js'))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('@@@ before:run @@@')
    expect(err.stdout).to.contain('@@@ after:run error @@@')
  })

  it('supports running user defined global hooks when only 1 hook is defined', async () => {
    await updateConfigFile(targetTestAppPath, 'index-run.js', 'global-hooks-overrides.js')
    const globalHooks = `setupNodeEvents(on, config) {
    on('after:run', () => {
      console.log('@@@ after:run @@@');
    });`
    await updateGlobalHooks(globalHooks)
    const [err, output] = await presult(runCypress())
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ after:run @@@')
  })
})

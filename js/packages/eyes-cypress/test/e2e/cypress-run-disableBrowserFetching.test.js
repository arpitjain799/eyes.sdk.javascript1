'use strict'
const path = require('path')
const {init, updateApplitoolsConfig, updateCypressConfig} = require('../util/pexec')
const exec = init()

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-disableBrowserFetching'

async function runCypress() {
  return (
    await exec(`npx cypress@latest run`, {
      cwd: targetTestAppPath,
      maxBuffer: 10000000,
    })
  ).stdout
}

async function updateConfigFile(pluginFileName, testName = 'global-hooks-overrides.js') {
  const promise = new Promise(resolve => {
    require('fs').readFile(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8', function (err, contents) {
      if (err) {
        console.log(err)
        return
      }

      const replaced = contents
        .replace(/index-run.js/g, pluginFileName)
        .replace(/integration-run/g, `integration-run/${testName}`)
      exec(updateCypressConfig(replaced), {
        cwd: targetTestAppPath,
      })
        .then(() => resolve())
        .catch(e => {
          throw new Error(e)
        })
    })
  })
  await promise
}

describe('disableBrowserFetching (parallel-test)', () => {
  beforeEach(async () => {
    await exec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
    const applitoolsConfig = require(path.resolve(targetTestAppPath, `./applitools.config.js`))
    applitoolsConfig.disableBrowserFetching = true
    await exec(updateApplitoolsConfig(applitoolsConfig), {
      cwd: targetTestAppPath,
    })
  })
  before(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
    await exec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    await exec(`rm ${targetTestAppPath}/cypress.json`)
    await exec('npm i --save-dev cypress@latest')
  })

  after(async () => {
    await exec(`rm -rf ${targetTestAppPath}`)
  })

  it('works for disableBrowserFetching.js', async () => {
    try {
      await updateConfigFile('index-run.js', 'disableBrowserFetching.js')
      await runCypress()
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})

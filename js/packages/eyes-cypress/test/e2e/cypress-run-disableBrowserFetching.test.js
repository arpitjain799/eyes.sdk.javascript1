'use strict'
const path = require('path')
const {pexec, updateApplitoolsConfig, updateCypressConfig} = require('../util/pexec')

const sourceTestAppPath = './test/fixtures/testApp'
const targetTestAppPath = './test/fixtures/testAppCopies/testApp-disableBrowserFetching'

async function runCypress() {
  return (
    await pexec(`npx cypress@latest run`, {
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
      pexec(updateCypressConfig(replaced), {
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
    await pexec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
    const applitoolsConfig = require(path.resolve(targetTestAppPath, `./applitools.config.js`))
    applitoolsConfig.disableBrowserFetching = true
    await pexec(updateApplitoolsConfig(applitoolsConfig), {
      cwd: targetTestAppPath,
    })
  })
  before(async () => {
    await pexec(`rm -rf ${targetTestAppPath}`)
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    await pexec(`rm ${targetTestAppPath}/cypress.json`)
    await pexec('npm i --save-dev cypress@latest')
  })

  after(async () => {
    await pexec(`rm -rf ${targetTestAppPath}`)
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

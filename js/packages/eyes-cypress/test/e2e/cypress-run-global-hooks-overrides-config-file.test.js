'use strict'
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(
  __dirname,
  '../fixtures/testAppCopies/testApp-global-hooks-overrides-config-file',
)
let latestCypressVersion = null

async function runCypress() {
  if (latestCypressVersion === null) {
    latestCypressVersion = (await pexec('npm view cypress version')).stdout.trim()
  }
  return (
    await pexec(`npx cypress@${latestCypressVersion} run`, {
      maxBuffer: 10000000,
    })
  ).stdout
}

async function updateConfigFile(pluginFileName, testName = 'global-hooks-overrides.js') {
  const promise = new Promise(resolve => {
    fs.readFile(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8', function (err, contents) {
      if (err) {
        console.log(err)
        return
      }

      const replaced = contents
        .replace(/index-run.js/g, pluginFileName)
        .replace(/integration-run/g, `integration-run/${testName}`)

      fs.writeFile(path.resolve(targetTestAppPath, `./cypress.config.js`), replaced, 'utf-8', function (err) {
        if (err) {
          console.log(err)
        }
        resolve()
      })
    })
  })
  await promise
}

function updateGlobalHooks(globalHooks) {
  let configContent = fs.readFileSync(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8')
  const content = configContent.replace(/setupNodeEvents\(on, config\) {/g, globalHooks)
  fs.writeFileSync(path.resolve(targetTestAppPath, `./cypress.config.js`), content, 'utf-8')
}

describe('global hooks override in cypress.config.js file', () => {
  beforeEach(async () => {
    fs.copyFileSync(
      `${__dirname}/../fixtures/cypressConfig-global-hooks-overrides-config-file.js`,
      `${targetTestAppPath}/cypress.config.js`,
    )
  })

  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    await pexec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
    fs.unlinkSync(`${targetTestAppPath}/cypress.json`)

    process.chdir(targetTestAppPath)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('supports running user defined global hooks from cypress.config.js file', async () => {
    await updateConfigFile('index-run.js')
    const globalHooks = `setupNodeEvents(on, config) {
      on('before:run', () => {
      console.log('@@@ before:run @@@');
      return null;
    });

    on('after:run', () => {
      console.log('@@@ after:run @@@');
      return null;
    });`
    updateGlobalHooks(globalHooks)
    const [err, output] = await presult(runCypress())
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ before:run @@@')
    expect(output).to.contain('@@@ after:run @@@')
  })
})

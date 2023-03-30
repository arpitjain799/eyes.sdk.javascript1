const path = require('path')
const fs = require('fs')
const pexec = require('./pexec')

module.exports = ({targetTestAppPath, sourceTestAppPath}) => ({
  beforeEach: async (applitoolsConfigOverride = {}) => {
    await pexec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
    const applitoolsConfig = require(path.resolve(targetTestAppPath, `./applitools.config.js`))
    Object.entries(applitoolsConfigOverride).forEach(([key, value]) => {
      applitoolsConfig[key] = value
    })
    fs.writeFileSync(
      path.resolve(targetTestAppPath, `./applitools.config.js`),
      `module.exports = ${JSON.stringify(applitoolsConfig)}`,
    )
  },
  before: async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    process.chdir(targetTestAppPath)
    fs.unlinkSync(`${targetTestAppPath}/cypress.json`)
    await pexec(`yarn`, {
      maxBuffer: 1000000,
    })
    await pexec('yarn add cypress@latest')
  },
  after: async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  },
  runCypress: () =>
    pexec('yarn cypress run', {
      maxBuffer: 10000000,
    }),
  updateConfigFile: async function (pluginFileName, testName = 'global-hooks-overrides.js') {
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
  },
})

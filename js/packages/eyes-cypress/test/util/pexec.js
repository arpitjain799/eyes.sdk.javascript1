const {exec} = require('child_process')
const path = require('path')
const fs = require('fs')
const {promisify: p} = require('util')
const pexec = p(exec)

function getMajorVersion(version) {
  return version.match(/(\d+)/g)[0] - ''
}

function addOpenSSLLegacyProvider(cmd, nodeVersion, env = {}) {
  let cypressVersion
  let nodeMajorVersion = getMajorVersion(nodeVersion)
  try {
    const npxCyVersion = cmd.match(/npx cypress@(\d+)/)
    if (npxCyVersion) cypressVersion = npxCyVersion[1]
    else cypressVersion = require(`${process.cwd()}/node_modules/cypress/package.json`).version
  } catch (_e) {}
  if (cypressVersion && getMajorVersion(cypressVersion) < 9 && nodeMajorVersion >= 18) {
    env.NODE_OPTIONS = '--openssl-legacy-provider'
  }
  return env
}

function pexecWrapper(cmd, options) {
  const promisePPexec = pexec(cmd, options)
  console.log(`$ ${cmd}`)
  // if (process.env.APPLITOOLS_SHOW_LOGS) {
  const {child} = promisePPexec
  child.stdout.on('data', msg => {
    console.log(msg)
  })
  // }
  return promisePPexec
}

function withTerminal() {
  return async function (cmd, options) {
    let {env, ...rest} = options || {}
    env = addOpenSSLLegacyProvider(cmd, process.version, env)
    return pexecWrapper(cmd, {...rest, env: {...process.env, ...env}})
  }
}

function withDocker() {
  let containerId
  const rootDir = '/app/packages/eyes-cypress'
  let nodeVersion
  before(async () => {
    containerId = (await pexec('docker run -d -it cypress-e2e')).stdout.replace(/\n/, '')
    nodeVersion = (await pexec(`docker exec ${containerId} node -v`)).stdout.replace(/\n/, '')
  })
  after(async () => {
    await pexec(`docker kill ${containerId}`)
    await pexec(`docker rm ${containerId}`)
  })
  return async function (cmd, options = {}) {
    let {cwd, env, ...rest} = options
    env = addOpenSSLLegacyProvider(cmd, nodeVersion, env)

    const w = cwd ? ' -w ' + cwd.replace(/^\./, rootDir) : ' '
    const e = Object.keys(env).length
      ? ' -e ' +
        Object.entries(env)
          .map(([k, v]) => `${k}=${v}`)
          .join(' -e ')
      : ' '
    return await pexecWrapper(`docker exec${w}${e} ${containerId} ${cmd}`, rest)
  }
}

function updateConfig(sourceConfigFile) {
  return function (config) {
    return updateFile(sourceConfigFile)(`module.exports = ${JSON.stringify(config, 2, null)}`)
  }
}

function updateFile(sourceConfigFile) {
  return function (string) {
    return `node -e 'console.log(require("fs").writeFileSync("${sourceConfigFile}", Buffer.from(\`${Buffer.from(
      string,
    ).toString('base64')}\`, "base64").toString()))'`
  }
}
async function updateConfigFile(targetTestAppPath, pluginFileName, testName) {
  const promise = new Promise(resolve => {
    require('fs').readFile(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8', function (err, contents) {
      if (err) {
        console.log(err)
        return
      }

      const replaced = contents
        .replace(/index-run.js/g, pluginFileName)
        .replace(/integration-run.*\'/g, `integration-run/${testName}\'`)
      pexecWrapper(updateCypressConfig(replaced), {
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

const updateCypressConfig = updateFile('./cypress.config.js')

module.exports = {
  init: process.env.APPLITOOLS_DOCKER === 'true' ? withDocker : withTerminal,
  updateApplitoolsConfig: updateConfig('./applitools.config.js'),
  updateApplitoolsConfigFile: function (file) {
    return updateConfig('./applitools.config.js')(require(file))
  },
  updateCypressConfigFile: function (file) {
    return updateFile('./cypress.config.js')(fs.readFileSync(file).toString())
  },
  updateCypressConfig,
  updateConfigFile,
}

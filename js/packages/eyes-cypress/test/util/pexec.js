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
  return async function (cmd, options = {}) {
    containerId = (await pexec('docker run -d -it cypress-e2e')).stdout.replace(/\n/, '')
    nodeVersion = (await pexec(`docker exec ${containerId} node -v`)).stdout.replace(/\n/, '')
    try {
      let {cwd, env, ...rest} = options
      env = addOpenSSLLegacyProvider(cmd, nodeVersion, env)

      cwd = cwd ? cwd : '.'
      const e = Object.keys(env).length
        ? ' -e ' +
          Object.entries(env)
            .map(([k, v]) => `${k}=${v}`)
            .join(' -e ')
        : ' '
      const containerCwd = path.resolve(rootDir, cwd)
      await pexecWrapper(`docker exec ${containerId} rm -rf ${containerCwd}`)
      await pexecWrapper(`docker cp ${path.resolve(process.cwd(), cwd)} ${containerId}:${containerCwd}`)
      const result = await pexecWrapper(`docker exec -w ${containerCwd} ${e} ${containerId} ${cmd}`, rest)
      await pexecWrapper(`docker cp ${containerId}:${containerCwd} ${path.resolve(process.cwd(), cwd)}`)
      return result
    } finally {
      await pexec(`docker kill ${containerId}`)
      await pexec(`docker rm ${containerId}`)
    }
  }
}

function updateConfig(sourceConfigFile) {
  return function (config, targetConfigFile) {
    return updateFile(sourceConfigFile)(`module.exports = ${JSON.stringify(config, 2, null)}`, targetConfigFile)
  }
}

function updateFile(sourceConfigFile) {
  return function (string, targetTestAppPath) {
    fs.writeFileSync(path.resolve(process.cwd(), targetTestAppPath, sourceConfigFile), string)
  }
}

const updateCypressConfig = updateFile('./cypress.config.js')

function updateConfigFile(targetTestAppPath, pluginFileName, testName) {
  const contents = fs.readFileSync(path.resolve(targetTestAppPath, `./cypress.config.js`)).toString()
  const replaced = contents
    .replace(/index-run.js/g, pluginFileName)
    .replace(/integration-run.*\'/g, `integration-run/${testName}\'`)
  updateCypressConfig(replaced, targetTestAppPath)
}

function updateGlobalHooks(globalHooks, targetTestAppPath) {
  let configContent = fs.readFileSync(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8')
  const content = configContent.replace(/setupNodeEvents\(on, config\) {/g, globalHooks)
  updateCypressConfig(content, targetTestAppPath)
}

module.exports = {
  init: process.env.APPLITOOLS_DOCKER === 'true' ? withDocker : withTerminal,
  exec: pexecWrapper,
  updateApplitoolsConfig: updateConfig('./applitools.config.js'),
  updateApplitoolsConfigFile: function (file, targetTestAppPath) {
    return updateConfig('./applitools.config.js')(require(file), targetTestAppPath)
  },
  updateCypressConfigFile: function (file, targetTestAppPath) {
    return updateFile('./cypress.config.js')(fs.readFileSync(file).toString(), targetTestAppPath)
  },
  updateCypressJSONConfigFile: function (json, targetTestAppPath) {
    return updateFile('./cypress.json')(JSON.stringify(json), targetTestAppPath)
  },
  updateCypressConfig,
  updateConfigFile,
  updateGlobalHooks,
}

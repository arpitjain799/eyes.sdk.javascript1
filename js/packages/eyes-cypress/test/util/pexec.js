const {exec} = require('child_process')
const fs = require('fs')
const {promisify: p} = require('util')
const pexec = p(exec)

function getMajorVersion(version) {
  return version.match(/(\d+)/g)[0] - ''
}

const nodeMajorVersion = getMajorVersion(process.version)

function addOpenSSLLegacyProvider(cmd, env = {}) {
  let cypressVersion
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
    env = addOpenSSLLegacyProvider(cmd, env)
    return pexecWrapper(cmd, {...rest, env: {...process.env, ...env}})
  }
}

function withDocker() {
  let containerId
  const rootDir = '/app/packages/eyes-cypress'
  before(async () => {
    containerId = (await pexec('docker run -d -it cypress-e2e')).stdout.replace(/\n/, '')
  })
  after(async () => {
    await pexec(`docker kill ${containerId}`)
    await pexec(`docker rm ${containerId}`)
  })
  return async function (cmd, options = {}) {
    let {cwd, env, ...rest} = options
    env = addOpenSSLLegacyProvider(cmd, env)

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

module.exports = {
  init: process.env.APPLITOOLS_DOCKER === 'true' ? withDocker : withTerminal,
  updateApplitoolsConfig: updateConfig('./applitools.config.js'),
  updateApplitoolsConfigFile: function (file) {
    return updateConfig('./applitools.config.js')(require(file))
  },
  updateCypressConfig: updateFile('./cypress.config.js'),
}

const {exec} = require('child_process')
const fs = require('fs')
const {promisify: p} = require('util')
const pexec = p(exec)

function getMajorVersion(version) {
  return version.match(/(\d+)/g)[0] - ''
}

const nodeMajorVersion = getMajorVersion(process.version)
const env = {...process.env}

function pexecWrapper(cmd, options) {
  const {env: optionsEnv} = options || {}
  let cypressVersion
  try {
    const npxCyVersion = cmd.match(/npx cypress@(\d+)/)
    if (npxCyVersion) cypressVersion = npxCyVersion[1]
    else cypressVersion = require(`${process.cwd()}/node_modules/cypress/package.json`).version
  } catch (_e) {}
  if (cypressVersion && getMajorVersion(cypressVersion) < 9 && nodeMajorVersion >= 18) {
    env.NODE_OPTIONS = '--openssl-legacy-provider'
  }
  if (optionsEnv) {
    Object.entries(optionsEnv).forEach(([k, v]) => {
      env[k] = v
    })
  }
  const promisePPexec = pexec(cmd, {...options, env})
  console.log(`$ ${cmd}`)
  // if (process.env.APPLITOOLS_SHOW_LOGS) {
  const {child} = promisePPexec
  child.stdout.on('data', msg => {
    console.log(msg)
  })
  // }
  return promisePPexec
}

function cypress(cmd, options) {
  return pexecWrapper(`yarn cypress ${cmd}`, options)
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
    const {cwd, env, ...rest} = options

    const w = cwd ? ' -w ' + cwd.replace(/^\./, rootDir) : ' '
    const e = env
      ? ' -e ' +
        Object.entries(env)
          .map(([k, v]) => `${k}=${v}`)
          .join(' -e ')
      : ' '
    return await pexecWrapper(`docker exec${w}${e} ${containerId} ${cmd}`, rest)
  }
}

function updateApplitoolsConfig(config) {
  return `node -e 'console.log(require("fs").writeFileSync("./applitools.config.js", "module.exports =" + JSON.stringify(${JSON.stringify(
    config,
    2,
    null,
  )})))'`
}

function updateApplitoolsConfigFile(file) {
  return updateApplitoolsConfig(require(file))
}

pexecWrapper.cypress = cypress
pexecWrapper.withDocker = withDocker
pexecWrapper.updateApplitoolsConfig = updateApplitoolsConfig
pexecWrapper.updateApplitoolsConfigFile = updateApplitoolsConfigFile

module.exports = pexecWrapper

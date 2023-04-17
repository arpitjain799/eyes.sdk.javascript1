const {exec} = require('child_process')
const {promisify: p} = require('util')
const pexec = p(exec)

function getMajorVersion(version) {
  return version.match(/(\d+)/g)[0] - ''
}

const nodeMajorVersion = getMajorVersion(process.version)
const env = {...process.env}

function pexecWarpper(cmd, options) {
  let cypressVersion
  try {
    const npxCyVersion = cmd.match(/npx cypress@(\d+)/)
    if (npxCyVersion) cypressVersion = npxCyVersion[1]
    else cypressVersion = require(`${process.cwd()}/node_modules/cypress/package.json`).version
  } catch (_e) {}
  if (cypressVersion && getMajorVersion(cypressVersion) < 9 && nodeMajorVersion >= 18) {
    env.NODE_OPTIONS = '--openssl-legacy-provider'
    cmd = `NODE_OPTIONS=--openssl-legacy-provider ${cmd}`
  }
  const promisePPexec = pexec(cmd, {...options, env})
  console.log(`$ ${cmd}`)
  if (process.env.APPLITOOLS_SHOW_LOGS) {
    const {child} = promisePPexec
    child.stdout.on('data', msg => {
      console.log(msg)
    })
  }
  return promisePPexec
}

function cypress(cmd, options) {
  return pexecWarpper(`yarn cypress ${cmd}`, options)
}

pexecWarpper.cypress = cypress

module.exports = pexecWarpper

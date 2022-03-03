const fetch = require('node-fetch')

async function debugEnvVar() {
  const envVarName = process.env.APPLITOOLS_DEBUG_ENV_VAR
  if (!envVarName) throw new Error('No target env var specified. Please specify one using APPLITOOLS_DEBUG_ENV_VAR')
  console.log(`[debug] env var ${envVarName}`)
  const target = process.env[envVarName]
  console.log(`[debug] env var value ${target}`)
  if (/http/.test(target)) {
    console.log('[debug] env var contains URI, attempting to fetch it')
    const result = await fetch(target)
    console.log(`[debug] request result: ${result.status}`)
  }
}

if (require.main === module) {
  ;(async () => await debugEnvVar())()
}

module.exports = debugEnvVar

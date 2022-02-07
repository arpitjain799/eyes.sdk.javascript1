const fs = require('fs')
const utils = require('@applitools/utils')

main({
  device: 'iPhone 11 Pro',
  osVersion: '14.5',
  jobs: process.env.MOCHA_JOBS ? Number(process.env.MOCHA_JOBS) : 2,
})

async function main({device, osVersion, jobs}) {
  console.log(`Installing runtime for iOS ${osVersion}...`)
  try {
    await utils.process.sh(`xcversion simulators --install='iOS ${osVersion}' --no-progress`, {
      spawnOptions: {stdio: 'pipe'},
    })
  } catch (err) {
    if (!err.stdout.includes('Simulator is already installed')) throw err
  }

  console.log('Running simulators...')
  const simulatorIds = await Promise.all(
    Array.from({length: jobs}, (_, index) => runSimulator({device, osVersion, index})),
  )

  fs.writeFileSync('./.env', `IOS_SIMULATOR_UDID=${simulatorIds.join(',')}\n`, {flag: 'a'})

  console.log('Done! All simulators are ready to use.')
}

async function runSimulator({device, osVersion, index}) {
  console.log(`Looking for devices for ${device} and iOS ${osVersion}...`)
  const listOutput = await utils.process.sh(`xcrun simctl list --json`, {spawnOptions: {stdio: 'pipe'}})
  const list = JSON.parse(listOutput.stdout)
  const runtime = list.runtimes.find(runtime => runtime.name === `iOS ${osVersion}`)
  const deviceType = list.devicetypes.find(deviceType => deviceType.name === device)
  const devices = list.devices[runtime.identifier].filter(
    device => device.deviceTypeIdentifier === deviceType.identifier,
  )

  let simulatorId, simulatorName
  if (devices[index]) {
    simulatorId = devices[index].udid
    simulatorName = devices[index].name
    console.log(`Already existed device for ${device} and iOS ${osVersion} found with name ${devices[index].name}`)
    if (devices[index].state === 'Booted') {
      console.log(`Simulator for device with name ${simulatorName} already booted`)
      return simulatorId
    }
  } else {
    simulatorName = `${device} (index: ${index})`
    console.log(`Creating device with name ${simulatorName}...`)
    const createOutput = await utils.process.sh(
      `xcrun simctl create '${simulatorName}' '${deviceType.identifier}' '${runtime.identifier}'`,
      {spawnOptions: {stdio: 'pipe'}},
    )
    simulatorId = createOutput.stdout.replace(/[\t\r\n\s]+/g, '')
  }

  console.log(`Running simulator for device with name ${simulatorName}...`)
  await utils.process.sh(`xcrun simctl boot '${simulatorId}'`, {spawnOptions: {stdio: 'pipe'}})

  console.log(`Waiting for the simulator with name ${simulatorName} to boot...`)
  await utils.process.sh(`xcrun simctl bootstatus '${simulatorId}'`, {spawnOptions: {stdio: 'pipe'}})

  return simulatorId
}

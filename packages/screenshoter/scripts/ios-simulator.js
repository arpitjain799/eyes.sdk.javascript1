const utils = require('@applitools/utils')

run()

async function run() {
  const {stdout} = await utils.process.sh(`xcrun simctl list --json devices available`, {spawnOptions: {stdio: 'pipe'}})
  const list = JSON.parse(stdout)

  // console.log(list.devices)

  const device = list.devices['com.apple.CoreSimulator.SimRuntime.iOS-14-5'].find(device => {
    return device.name === 'iPhone 11 Pro'
  })

  if (device) {
    if (device.state === 'Booted') return console.log('Device is already booted')
    await utils.process.sh(`xcrun simctl boot ${device.udid}`, {spawnOptions: {stdio: 'pipe'}})
  }
}

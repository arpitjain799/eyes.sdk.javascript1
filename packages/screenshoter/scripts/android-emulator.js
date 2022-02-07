const utils = require('@applitools/utils')

run()

// it requires android sdk to be installed
async function run() {
  console.log('Accepting android sdk licenses...')
  await utils.process.sh(`yes | sdkmanager --licenses`, {
    spawnOptions: {stdio: 'pipe'},
  })

  console.log('Installing required dependencies...')
  await utils.process.sh(
    `sdkmanager --install 'emulator' 'cmdline-tools;latest' 'build-tools;29.0.3' 'platform-tools' 'platforms;android-29' 'system-images;android-29;google_apis;x86_64'`,
    {spawnOptions: {stdio: 'pipe'}},
  )

  console.log('Creating AVD (android virtual device)...')
  await utils.process.sh(
    `avdmanager create avd --force --name 'Pixel_3a_XL' --device pixel_3a_xl --package 'system-images;android-29;google_apis;x86_64'`,
    {spawnOptions: {stdio: 'pipe'}},
  )

  console.log('Running emulator...')
  await utils.process.sh('emulator -no-boot-anim -avd Pixel_3a_XL &', {
    spawnOptions: {detached: true, stdio: 'ignore'},
  })

  console.log('Waiting for device to be up...')
  await utils.process.sh(`adb wait-for-device`, {
    spawnOptions: {stdio: 'pipe'},
  })

  console.log('Waiting for device to be booted...')
  let isBooted = false
  do {
    await utils.general.sleep(3000)
    const {stdout} = await utils.process.sh(`adb shell getprop sys.boot_completed`, {
      spawnOptions: {stdio: 'pipe'},
    })
    isBooted = stdout.replace(/[\t\r\n\s]+/, '') === '1'
  } while (!isBooted)
  console.log('Done! Emulator is ready to use.')
}

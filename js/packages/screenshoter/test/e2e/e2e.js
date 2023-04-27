const assert = require('assert')
const webdriverio = require('webdriverio')
const pixelmatch = require('pixelmatch')
const utils = require('@applitools/utils')
const spec = require('@applitools/spec-driver-webdriverio')
const {makeLogger} = require('@applitools/logger')
const {Driver} = require('@applitools/driver')
const {makeImage} = require('@applitools/image')
const takeScreenshot = require('../../src/take-screenshot')

const logger = (exports.logger = makeLogger())

async function sanitizeAndroidStatusBar(image) {
  const leftPatchImage = makeImage({
    width: 425,
    height: 17,
    data: Buffer.alloc(425 * 17 * 4, Buffer.from([0, 0xed, 0xed, 0xff])),
  })
  await image.copy(leftPatchImage, {x: 3, y: 3})
}

async function sanitizeIOSStatusBar(image) {
  const leftPatchImage = makeImage({
    width: 360,
    height: 17,
    data: Buffer.alloc(360 * 17 * 4, Buffer.from([0, 0xed, 0xed, 0xff])),
  })
  await image.copy(leftPatchImage, {x: 15, y: 15})
}

exports.sleep = utils.general.sleep

exports.test = async function test({type, tag, driver, ...options} = {}) {
  if (options.withStatusBar) tag += '-statusbar'

  logger.log('Test started')

  const screenshot = await takeScreenshot({driver, ...options})
  try {
    if (options.withStatusBar) {
      if (type === 'android') await sanitizeAndroidStatusBar(screenshot.image)
      else if (type === 'ios') await sanitizeIOSStatusBar(screenshot.image)
    }
    const actual = await screenshot.image.toObject()

    const expected = await makeImage(`./test/fixtures/${type}/${tag}.png`).toObject()
    assert.strictEqual(
      pixelmatch(actual.data, expected.data, null, expected.width, expected.height),
      0,
      `Test filed! the image Pixel not match\n\tThe output failed test image is located in the ${process.cwd()}/logs folder`,
    )
  } catch (err) {
    await screenshot.image.debug({
      path: './logs',
      name: `${type}--${tag}` + (options.scrollingMode === 'css' ? '-css' : ''),
    })
    throw err
  } finally {
    await screenshot.restoreState()
  }
}

exports.testCodedRegions = async function testCodedRegions({driver, ...options}, expectedCoordinates) {
  const {calculatedRegions} = await takeScreenshot({driver, ...options})
  const roundedRegionsArray = calculatedRegions.map(regions => {
    const result = []
    for (const r of regions.regions) {
      result.push({
        region: {
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width),
          height: Math.round(r.height),
        },
      })
    }
    return {regions: result, selector: regions.selector}
  })

  assert.deepEqual(roundedRegionsArray, expectedCoordinates)
}

exports.makeDriver = async function makeDriver({
  type,
  env,
  app,
  orientation,
  logger,
  deviceName,
  platformVersion,
  emulation,
  disableHelper,
  headless = true,
  ...rest
}) {
  const workerId = process.env.MOCHA_WORKER_ID ? Number(process.env.MOCHA_WORKER_ID) : 0
  console.log(`makeDriver called for worker #${process.env.MOCHA_WORKER_ID}`, workerId)
  const androidEmulatorIds = process.env.ANDROID_EMULATOR_UDID
    ? process.env.ANDROID_EMULATOR_UDID.split(',')
    : ['emulator-5555']
  const iosSimulatorIds = process.env.IOS_SIMULATOR_UDID ? process.env.IOS_SIMULATOR_UDID.split(',') : []
  const apps = {
    android: 'https://applitools.jfrog.io/artifactory/Examples/android/1.3/app-debug.apk',
    androidx: 'https://applitools.jfrog.io/artifactory/Examples/androidx/helper_lib/1.8.6/app-androidx-debug.apk',
    ios: 'https://applitools.jfrog.io/artifactory/Examples/IOSTestApp/1.9/app/IOSTestApp.zip',
  }

  const envs = {
    chrome: {
      url: 'http://localhost:4444/wd/hub',
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: headless ? ['headless'] : [],
          mobileEmulation: emulation && {deviceName: emulation},
        },
      },
    },
    android: {
      url: 'http://0.0.0.0:4723/wd/hub',
      capabilities: {
        'appium:udid': androidEmulatorIds[workerId],
        'appium:systemPort': 8200 + workerId,
        'appium:mjpegServerPort': 9100 + workerId,
        'appium:chromedriverPort': 9515 + workerId,
        'appium:adbExecTimeout': 30000,
        'appium:uiautomator2ServerLaunchTimeout': 240000,
        'appium:newCommandTimeout': 0,
        'appium:nativeWebScreenshot': true,
        'appium:skipUnlock': true,
        'appium:isHeadless': true,
        browserName: app === 'chrome' ? app : '',
        'appium:app': app === 'chrome' ? undefined : apps[app || type] || app,
        'appium:deviceName': deviceName || 'Google Pixel 3a XL',
        platformName: 'Android',
        'appium:platformVersion': platformVersion || '11.0',
        'appium:automationName': 'uiautomator2',
        'appium:orientation': orientation ? orientation.toUpperCase() : 'PORTRAIT',
        ...rest,
      },
    },
    'android-sauce': {
      url: 'https://ondemand.us-west-1.saucelabs.com/wd/hub',
      capabilities: {
        automationName: 'uiautomator2',
        name: 'Android screenshoter',
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY,
        browserName: app === 'chrome' ? app : '',
        app: app === 'chrome' ? undefined : apps[app || type] || app,
        deviceName: deviceName || 'Google Pixel 3a XL GoogleAPI Emulator',
        platformName: 'Android',
        platformVersion: platformVersion || '10.0',
        extendedDebugging: true,
        deviceOrientation: orientation ? orientation.toUpperCase() : 'PORTRAIT',
      },
    },
    'android-bs': {
      url: 'https://hub.browserstack.com/wd/hub',
      capabilities: {
        'bstack:options': {
          // realMobile: 'true',
          // appiumVersion: '1.20.2',
          deviceOrientation: orientation ? orientation.toUpperCase() : 'PORTRAIT',
          userName: process.env.BROWSERSTACK_USERNAME,
          accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        },
        browserName: app === 'chrome' ? app : '',
        platformName: 'Android',
        'appium:platformVersion': platformVersion || '9.0',
        'appium:deviceName': deviceName || 'Google Pixel 3a XL',
        'appium:app': app === 'chrome' ? undefined : apps[app || type] || app,
      },
    },
    ios: {
      url: 'http://0.0.0.0:4723/wd/hub',
      capabilities: {
        'appium:udid': iosSimulatorIds[workerId],
        'appium:wdaLocalPort': 8100 + workerId,
        'appium:mjpegServerPort': 9100 + workerId,
        'appium:derivedDataPath': `~/Library/Developer/Xcode/DerivedData/Appium-${workerId}`,
        'appium:launchTimeout': 90000,
        'appium:newCommandTimeout': 0,
        'appium:webviewConnectRetries': 16,
        'appium:usePrebuiltWDA': false,
        // isHeadless: true,
        browserName: app === 'safari' ? app : '',
        'appium:app': apps[app || type] || (app !== 'safari' ? app : undefined),
        'appium:deviceName': deviceName || 'iPhone 12',
        platformName: 'iOS',
        'appium:platformVersion': platformVersion || '16.0',
        'appium:automationName': 'XCUITest',
        'appium:orientation': orientation ? orientation.toUpperCase() : 'PORTRAIT',
        ...rest,
      },
    },
    'ios-sauce': {
      url: 'https://ondemand.saucelabs.com:443/wd/hub',
      capabilities: {
        name: 'IOS screenshoter',
        appiumVersion: '1.20.0',
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY,
        browserName: app === 'safari' ? app : '',
        app: apps[app || type] || (app !== 'safari' ? app : undefined),
        deviceName: deviceName || 'iPhone 12 Simulator',
        platformName: 'iOS',
        platformVersion: platformVersion || '14.5',
        deviceOrientation: orientation ? orientation.toUpperCase() : 'PORTRAIT',
      },
    },
    'ios-bs': {
      url: 'https://hub.browserstack.com/wd/hub',
      capabilities: {
        'bstack:options': {
          // realMobile: 'true',
          // appiumVersion: '1.20.2',
          // local: 'true',
          deviceOrientation: orientation ? orientation.toUpperCase() : 'PORTRAIT',
          userName: process.env.BROWSERSTACK_USERNAME,
          accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        },
        browserName: app === 'safari' ? app : '',
        platformName: 'iOS',
        'appium:app': apps[app || type] || (app !== 'safari' ? app : undefined),
        'appium:deviceName': deviceName || 'iPhone 12',
        'appium:platformVersion': platformVersion || '14.1',
        // 'appium:autoAcceptAlerts': true,
      },
    },
  }
  env = env || envs[process.env.APPLITOOLS_TEST_REMOTE === 'sauce' ? `${type}-sauce` : type]
  const url = new URL(env.url)
  const browser = await webdriverio.remote({
    protocol: url.protocol ? url.protocol.replace(/:$/, '') : undefined,
    hostname: url.hostname,
    port: Number(url.port),
    path: url.pathname,
    capabilities: env.capabilities,
    logLevel: 'silent',
    connectionRetryCount: 0,
    connectionRetryTimeout: 240000,
  })

  const driver = new Driver({driver: browser, spec, logger})
  if (disableHelper) driver._helper = null
  if (process.env.APPLITOOLS_TEST_REMOTE === 'sauce')
    console.log(`Running on Sauce Labs at: https://app.saucelabs.com/tests/${driver.target.sessionId}`)
  return [
    driver,
    async () => {
      try {
        browser.deleteSession()
      } catch (error) {
        // don't error if unable to cleanup the browser, it creates unnecessary test failures
      }
    },
  ]
}

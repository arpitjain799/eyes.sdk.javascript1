function createRenderRequest({
  type = 'web',
  url,
  snapshot,
  resources,
  browser,
  renderInfo,
  target,
  selector,
  selectorsToFindRegionsFor,
  region,
  scriptHooks,
  sendDom,
  visualGridOptions,
  includeFullPageSize,
}) {
  const {chromeEmulationInfo, iosDeviceInfo, androidDeviceInfo, ...browserInfo} = browser

  let platformName = browserInfo.platform
  let browserName = browserInfo.name
  let emulationInfo
  if (iosDeviceInfo) {
    platformName = 'ios'
    if (type === 'web') browserName = 'safari'
  } else if (androidDeviceInfo) {
    platformName = 'android'
  }
  if (browserInfo.deviceScaleFactor) {
    emulationInfo = {
      deviceScaleFactor: browserInfo.deviceScaleFactor,
      width: browserInfo.width,
      height: browserInfo.height,
      mobile: browserInfo.mobile,
      screenOrientation: browserInfo.screenOrientation,
    }
  }

  return {
    webhook: renderInfo.getResultsUrl(),
    stitchingService: renderInfo.getStitchingServiceUrl(),
    url,
    platform: {name: platformName, type},
    browser: {name: browserName},
    renderInfo: {
      target,
      width: browserInfo.width,
      height: browserInfo.height,
      selector,
      region,
      emulationInfo: chromeEmulationInfo || emulationInfo,
      iosDeviceInfo,
      androidDeviceInfo,
    },
    snapshot,
    resources,
    options: visualGridOptions,
    scriptHooks,
    selectorsToFindRegionsFor,
    enableMultipleResultsPerSelector: true,
    includeFullPageSize,
    sendDom,
  }
}

module.exports = createRenderRequest

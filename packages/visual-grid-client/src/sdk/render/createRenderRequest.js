function createRenderRequest({
  isNativeUFG,
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
  agentId,
}) {
  const {chromeEmulationInfo, iosDeviceInfo, androidDeviceInfo, ...browserInfo} = browser

  let platformName = browserInfo.platform || 'linux'
  let browserName = browserInfo.name
  if (iosDeviceInfo) {
    platformName = 'ios'
    browserName = 'safari'
  } else if (androidDeviceInfo) {
    platformName = 'android'
  }

  let width = browserInfo.width
  let height = browserInfo.height
  if (chromeEmulationInfo) {
    if (!width) width = chromeEmulationInfo.width
    if (!height) height = chromeEmulationInfo.height
  }

  return {
    webhook: renderInfo.getResultsUrl(),
    stitchingService: renderInfo.getStitchingServiceUrl(),
    url,
    platform: {name: platformName, type: isNativeUFG ? 'native' : 'web'},
    browser: isNativeUFG ? undefined : {name: browserName},
    renderInfo: {
      target,
      width,
      height,
      selector,
      region,
      emulationInfo: chromeEmulationInfo,
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
    agentId,
  }
}

function enrichRenderRequest(renderRequest, {dom, resources, snapshot, renderer}) {
  renderRequest.snapshot = dom
  renderRequest.resources = resources
  renderRequest.renderer = renderer
  renderRequest.renderInfo.vhsType = snapshot.vhsType
  renderRequest.renderInfo.vhsCompatibilityParams = snapshot.vhsCompatibilityParams
}

module.exports = {
  createRenderRequest,
  enrichRenderRequest,
}

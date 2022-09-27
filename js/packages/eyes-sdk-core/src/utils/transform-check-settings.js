function transformCheckSettings(settings) {
  return dropUndefinedProperties({
    name: settings.name,
    region: settings.region,
    frames: settings.frames,
    scrollRootElement: settings.scrollRootElement,
    fully: settings.fully,
    matchLevel: settings.matchLevel,
    useDom: settings.useDom,
    sendDom: settings.sendDom,
    enablePatterns: settings.enablePatterns,
    ignoreDisplacements: settings.ignoreDisplacements,
    ignoreCaret: settings.ignoreCaret,
    ignoreRegions: settings.ignoreRegions,
    layoutRegions: settings.layoutRegions,
    strictRegions: settings.strictRegions,
    contentRegions: settings.contentRegions,
    floatingRegions: settings.floatingRegions,
    accessibilityRegions: settings.accessibilityRegions,
    disableBrowserFetching: settings.disableBrowserFetching,
    layoutBreakpoints: settings.layoutBreakpoints,
    ufgOptions: settings.visualGridOptions,
    hooks: settings.hooks,
    pageId: settings.pageId,
    lazyLoad: settings.lazyLoad,
    waitBeforeCapture: settings.waitBeforeCapture,
    retryTimeout: settings.timeout,
    userCommandId: settings.variationGroupId,
    webview: settings.webview,
  })
}

function dropUndefinedProperties(object) {
  return Object.entries(object).reduce(
    (object, [key, value]) => (value !== undefined ? Object.assign(object, {[key]: value}) : object),
    {},
  )
}

module.exports = transformCheckSettings

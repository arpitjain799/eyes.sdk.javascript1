function eyesOpenMapValues({args, appliConfFile, testName, shouldUseBrowserHooks, defaultBrowser}) {
  let browsersInfo = args.browser || appliConfFile.browser || defaultBrowser;

  if (browsersInfo) {
    if (Array.isArray(browsersInfo)) {
      browsersInfo.forEach(fillDefaultBrowserName);
    } else {
      fillDefaultBrowserName(browsersInfo);
      browsersInfo = [browsersInfo];
    }
  }

  const mappedArgs = {
    ...args,
    browsersInfo,
  };

  delete mappedArgs.browser;
  delete appliConfFile.browser;

  return Object.assign(
    {testName, dontCloseBatches: !shouldUseBrowserHooks},
    appliConfFile,
    mappedArgs,
  );
}

function fillDefaultBrowserName(browser) {
  if (!browser.name && !browser.iosDeviceInfo && !browser.chromeEmulationInfo) {
    browser.name = 'chrome';
  }
}

module.exports = {eyesOpenMapValues};

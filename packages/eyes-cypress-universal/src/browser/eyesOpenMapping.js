function eyesOpenMapValues({args, cypress = Cypress}) {
  const appliConfFile = cypress.config('appliConfFile');
  const {browser: eyesOpenBrowser} = args;
  const globalBrowser = getGlobalConfigProperty('eyesBrowser', cypress);

  let browsersInfo =
    validateBrowser(eyesOpenBrowser) || validateBrowser(globalBrowser) || appliConfFile.browser;

  if (browsersInfo) {
    if (Array.isArray(browsersInfo)) {
      browsersInfo.forEach(fillDefaultBrowserName);
    } else {
      fillDefaultBrowserName(browsersInfo);
      browsersInfo = [browsersInfo];
    }
  }

  delete args.browser;
  delete appliConfFile.browser;

  return Object.assign({}, args, {browsersInfo}, appliConfFile);
}

function getGlobalConfigProperty(prop, cypress) {
  const property = cypress.config(prop);
  const shouldParse = ['eyesBrowser'];
  return property ? (shouldParse.includes(prop) ? JSON.parse(property) : property) : undefined;
}

function validateBrowser(browser) {
  if (!browser) return false;
  if (Array.isArray(browser)) return browser.length ? browser : false;
  if (Object.keys(browser).length === 0) return false;
  return browser;
}

function fillDefaultBrowserName(browser) {
  if (!browser.name && !browser.iosDeviceInfo && !browser.chromeEmulationInfo) {
    browser.name = 'chrome';
  }
}

module.exports = {eyesOpenMapValues};

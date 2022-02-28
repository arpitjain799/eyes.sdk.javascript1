function eyesOpenMapValues({args, appliConfFile, testName, shouldUseBrowserHooks, defaultBrowser}) {
  let browsersInfo = args.browser || appliConfFile.browser || defaultBrowser;

  if (!Array.isArray(browsersInfo)) browsersInfo = [browsersInfo];

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

module.exports = {eyesOpenMapValues};

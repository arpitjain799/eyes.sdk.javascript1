function eyesCheckMapValues({args, cypress = Cypress}) {
  const propsToDelete = ['layoutBreakpoints', 'waitBeforeCapture', 'ignoreDisplacements'];
  const eyesOpenArgs = getGlobalConfigProperty('eyesOpenArgs', cypress);
  const appliConfFile = cypress.config('appliConfFile');

  const globalArgs = {
    layoutBreakpoints: getGlobalConfigProperty('eyesLayoutBreakpoints', cypress),
    waitBeforeCapture: getGlobalConfigProperty('eyesWaitBeforeCapture', cypress),
  };

  const layoutBreakpoints =
    (args && args.layoutBreakpoints) ||
    (eyesOpenArgs && eyesOpenArgs.layoutBreakpoints) ||
    globalArgs.layoutBreakpoints ||
    appliConfFile.layoutBreakpoints;

  const waitBeforeCapture =
    (args && args.waitBeforeCapture) ||
    (eyesOpenArgs && eyesOpenArgs.waitBeforeCapture) ||
    globalArgs.waitBeforeCapture ||
    appliConfFile.waitBeforeCapture;

  const ignoreDisplacements =
    (args && args.ignoreDisplacements) || appliConfFile.ignoreDisplacements;

  const checkArgs = {layoutBreakpoints, waitBeforeCapture, ignoreDisplacements};
  if (typeof args === 'object') {
    Object.assign(checkArgs, args);
  } else {
    Object.assign(checkArgs, {tag: args});
  }

  for (const prop of propsToDelete) {
    delete appliConfFile[prop];
  }

  return Object.assign({}, appliConfFile, toCheckWindowConfiguration(checkArgs));
}

function getGlobalConfigProperty(prop, cypress) {
  const property = cypress.config(prop);
  const shouldParse = ['eyesLayoutBreakpoints'];
  return property ? (shouldParse.includes(prop) ? JSON.parse(property) : property) : undefined;
}

function toCheckWindowConfiguration(config) {
  const mappedValues = [
    'tag',
    'hooks',
    'ignore',
    'floating',
    'strict',
    'layout',
    'content',
    'accessibility',
    'region',
    'selector',
  ];

  let regionSettings = {};
  let shadowDomSettings = {};
  const checkSettings = {
    name: config.tag,
    scriptHooks: config.hooks,
    ignoreRegions: config.ignore,
    floatingRegions: config.floating,
    strictRegions: config.strict,
    layoutRegions: config.layout,
    contentRegions: config.content,
    accessibilityRegions: config.accessibility,
  };

  if (config.target === 'region') {
    if (!Array.isArray(config.selector)) {
      if (!config.hasOwnProperty('selector')) {
        regionSettings = {
          region: config.region,
        };
      } else {
        regionSettings = {
          region: config.selector,
        };
      }
    } else {
      const selectors = config.selector;
      for (let i = selectors.length - 1; i > -1; i--) {
        if (i === selectors.length - 1) {
          shadowDomSettings['shadow'] = selectors[i].selector;
        } else {
          const prevSettings = Object.assign({}, shadowDomSettings);
          shadowDomSettings['selector'] = selectors[i].selector;
          if (!prevSettings.hasOwnProperty('selector')) {
            shadowDomSettings['shadow'] = prevSettings.shadow;
          } else {
            shadowDomSettings['shadow'] = prevSettings;
          }
        }
      }
      regionSettings = {region: shadowDomSettings};
    }
  }

  for (const val of mappedValues) {
    if (config.hasOwnProperty(val)) {
      delete config[val];
    }
  }

  return Object.assign({}, checkSettings, regionSettings, config);
}

module.exports = {eyesCheckMapValues};

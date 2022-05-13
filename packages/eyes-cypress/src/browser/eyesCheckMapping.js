function eyesCheckMapValues({args}) {
  return toCheckWindowConfiguration(args);
}

function toCheckWindowConfiguration(config = {}) {
  const mappedValues = [
    'tag',
    'scriptHooks',
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
    hooks: config.scriptHooks,
    ignoreRegions: covertRegions(config.ignore),
    floatingRegions: convertFloatingRegion(config.floating),
    strictRegions: covertRegions(config.strict),
    layoutRegions: covertRegions(config.layout),
    contentRegions: covertRegions(config.content),
    accessibilityRegions: convertAccessabilityRegions(config.accessibility),
  };

  if (config.target === 'region') {
    if (!Array.isArray(config.selector)) {
      if (config.element) {
        regionSettings = {
          region: {selector: config.element.selector},
        };
      } else if (!config.hasOwnProperty('selector')) {
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

function convertAccessabilityRegions(accessibilityRegions) {
  if (!accessibilityRegions) return accessibilityRegions;

  return accessibilityRegions.map(region => ({
    region: covertRegions(region)[0].selector,
    type: region.accessibilityType,
  }));
}

function convertFloatingRegion(floatingRegions) {
  if (!floatingRegions) return floatingRegions;

  return floatingRegions.map(region => {
    const floatingRegion = {
      maxDownOffset: region.maxDownOffset || 0,
      maxLeftOffset: region.maxLeftOffset || 0,
      maxUpOffset: region.maxUpOffset || 0,
      maxRightOffset: region.maxRightOffset || 0,
    };
    if (region.hasOwnProperty('selector')) {
      floatingRegion.region = region.selector;
    } else if (region.hasOwnProperty('element')) {
      floatingRegion.region = covertRegions(region)[0].selector;
    } else {
      floatingRegion.region = {
        top: region.top,
        left: region.left,
        width: region.width,
        height: region.height,
      };
    }
    return floatingRegion;
  });
}

function covertRegions(regions) {
  if (!regions) return regions;
  if (!(regions instanceof Array)) regions = [regions];
  return regions.map(region => {
    if (region.element) {
      return {selector: region.element.selector};
    } else {
      return region;
    }
  });
}

module.exports = {eyesCheckMapValues};

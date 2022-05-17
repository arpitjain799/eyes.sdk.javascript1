function makeEyesCheckMapping(refer) {
  return function eyesCheckMapValues({args}) {
    return toCheckWindowConfiguration(args);
  };

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
      ignoreRegions: refElements(config.ignore),
      floatingRegions: convertFloatingRegion(config.floating),
      strictRegions: refElements(config.strict),
      layoutRegions: refElements(config.layout),
      contentRegions: refElements(config.content),
      accessibilityRegions: convertAccessabilityRegions(config.accessibility),
    };

    if (config.target === 'region') {
      if (!Array.isArray(config.selector)) {
        if (config.element && config.element.constructor) {
          if (isHTMLElement(config.element)) {
            regionSettings = {
              region: refer.ref(config.element),
            };
          } else {
            // JQuery element
            regionSettings = {
              region: refer.ref(config.element[0]),
            };
          }
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
    const accessibility = [];

    accessibilityRegions.map(region => {
      const accessabilityRegion = {
        type: region.accessibilityType,
      };
      if (region.hasOwnProperty('selector')) {
        accessabilityRegion.region = region.selector;
        accessibility.push(accessabilityRegion);
      } else if (region.hasOwnProperty('element')) {
        const elements = refElements(region.element);
        elements.map(element => {
          accessibility.push(Object.assign({}, accessabilityRegion, {region: element}));
        });
      } else {
        accessabilityRegion.region = {
          top: region.top,
          left: region.left,
          width: region.width,
          height: region.height,
        };
        accessibility.push(accessabilityRegion);
      }
    });

    return accessibility;
  }

  function convertFloatingRegion(floatingRegions) {
    if (!floatingRegions) return floatingRegions;
    const floating = [];

    floatingRegions.map(region => {
      const floatingRegion = {
        maxDownOffset: region.maxDownOffset || 0,
        maxLeftOffset: region.maxLeftOffset || 0,
        maxUpOffset: region.maxUpOffset || 0,
        maxRightOffset: region.maxRightOffset || 0,
      };
      if (region.hasOwnProperty('selector')) {
        floatingRegion.region = region.selector;
        floating.push(floatingRegion);
      } else if (region.hasOwnProperty('element')) {
        const elements = refElements(region.element);
        elements.map(element => {
          floating.push(Object.assign({}, floatingRegion, {region: element}));
        });
      } else {
        floatingRegion.region = {
          top: region.top,
          left: region.left,
          width: region.width,
          height: region.height,
        };
        floating.push(floatingRegion);
      }
    });

    return floating;
  }

  function refElements(regions) {
    if (!regions) return regions;
    if (!(regions instanceof Array)) regions = [regions];
    const elements = [];
    regions.map(region => {
      if (region.constructor) {
        if (isHTMLElement(region)) {
          elements.push(refer.ref(region));
        } else if (region.constructor.name === 'jQuery') {
          region.each(function() {
            elements.push(refer.ref(this));
          });
        }
      } else {
        elements.push(region);
      }
    });
    return elements;
  }

  function isHTMLElement(element) {
    if (element.constructor.name.includes('HTML') && element.constructor.name.includes('Element')) {
      return true;
    } else {
      return false;
    }
  }
}

module.exports = {makeEyesCheckMapping};

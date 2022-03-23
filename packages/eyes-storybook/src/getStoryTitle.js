'use strict';

function getStoryTitle({name, kind, parameters}) {
  const queryParams = (parameters && parameters.eyes && parameters.eyes.queryParams) || {};
  const eyesVariation = queryParams['eyes-variation'];
  const controls = parameters?.eyes?.controls;

  return `${kind}: ${name}${eyesVariation ? ` [${eyesVariation}]` : ''}${controls ? `[${controls.name}:${controls.value}]` : ''}`;
}

module.exports = getStoryTitle;

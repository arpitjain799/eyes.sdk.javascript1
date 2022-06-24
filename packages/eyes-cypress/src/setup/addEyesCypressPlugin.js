'use strict';

const pluginRequire = `\n\nrequire('@applitools/eyes-cypress')(module);\n`;
const oldName = `eyes.cypress`;
const cypress10PluginRequire = `setupNodeEvents(on, config) {
          if(!eyesSetup) {
            eyesSetup = true
            require('@applitools/eyes-cypress')(module)
            return module.exports(on, config) 
          }
    `;
const eyesSetupFlag = `
let eyesSetup = false \n
module.exports = defineConfig({`;

function addEyesCypressPlugin(content) {
  if (!content.includes(oldName)) {
    return content.replace(/([\s\S])$/, `$1${pluginRequire}`);
  } else {
    return content.replace(oldName, 'eyes-cypress');
  }
}

function addEyesCypress10Plugin(configContent) {
  return configContent
    .replace('module.exports = defineConfig({', eyesSetupFlag)
    .replace('setupNodeEvents(on, config) {', cypress10PluginRequire);
}

module.exports = {addEyesCypressPlugin, addEyesCypress10Plugin, pluginRequire};

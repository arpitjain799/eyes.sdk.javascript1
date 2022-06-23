'use strict';

const pluginRequire = `\n\nrequire('@applitools/eyes-cypress')(module);\n`;
const oldName = `eyes.cypress`;
const cypress10PluginRequire = `setupNodeEvents(on, config) {
      require('@applitools/eyes-cypress')(module)
      return module.exports(on, config)`;

function addEyesCypressPlugin(content) {
  if (!content.includes(oldName)) {
    return content.replace(/([\s\S])$/, `$1${pluginRequire}`);
  } else {
    return content.replace(oldName, 'eyes-cypress');
  }
}

function addEyesCypress10Plugin(configContent) {
  return configContent.replace('setupNodeEvents(on, config) {', cypress10PluginRequire);
}

module.exports = {addEyesCypressPlugin, addEyesCypress10Plugin};
module.exports.pluginRequire = pluginRequire;

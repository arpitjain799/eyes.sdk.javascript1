'use strict';

const {readFileSync, writeFileSync} = require('fs');
const chalk = require('chalk');
const {addEyesCypressPlugin, addEyesCypress10Plugin} = require('./addEyesCypressPlugin');
const isPluginDefined = require('./isPluginDefined');
const getFilePath = require('./getFilePath');
const getCypressConfig = require('./getCypressConfig');
const getLegacyPuginFilePath = require('./getLegacyPuginFilePath');
const fs = require('fs');
const path = require('path');

function handlePlugin(cwd) {
  const cypressConfig = getCypressConfig(cwd);
  const pluginsFilePath = getFilePath('plugins', cypressConfig, cwd);
  const pluginsFileContent = readFileSync(pluginsFilePath).toString();

  if (!isPluginDefined(pluginsFileContent)) {
    writeFileSync(pluginsFilePath, addEyesCypressPlugin(pluginsFileContent));
    console.log(chalk.cyan('Plugins defined.'));
  } else {
    console.log(chalk.cyan('Plugins already defined'));
  }
}

function handlerPluginCypress10(cwd) {
  const configContent = fs.readFileSync(path.resolve(cwd, 'cypress.config.js'), 'utf-8');
  const legacyPluginsFilePath = getLegacyPuginFilePath(cwd, configContent);
  if (legacyPluginsFilePath) {
    const pluginsFileContent = readFileSync(legacyPluginsFilePath, 'utf-8');
    if (!isPluginDefined(pluginsFileContent)) {
      writeFileSync(legacyPluginsFilePath, addEyesCypressPlugin(pluginsFileContent));
      console.log(chalk.cyan('Plugins defined.'));
    } else {
      console.log(chalk.cyan('Plugins already defined'));
    }
  } else {
    if (!isPluginDefined(configContent)) {
      writeFileSync(path.resolve(cwd, 'cypress.config.js'), addEyesCypress10Plugin(configContent));
      console.log(chalk.cyan('Plugins defined.'));
    } else {
      console.log(chalk.cyan('Plugins already defined'));
    }
  }
}

module.exports = {handlePlugin, handlerPluginCypress10};

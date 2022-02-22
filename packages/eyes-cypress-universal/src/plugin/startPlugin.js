'use strict';
const makePluginExport = require('./pluginExport');
const makeConfig = require('./config');
const makeStartServer = require('./server');

const {config, eyesConfig} = makeConfig();

const startServer = makeStartServer();

module.exports = makePluginExport({
  startServer,
  eyesConfig: Object.assign({}, eyesConfig, {appliConfFile: config}),
});

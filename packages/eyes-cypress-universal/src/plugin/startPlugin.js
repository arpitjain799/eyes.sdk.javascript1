'use strict';
const makePluginExport = require('./pluginExport');
const makeGlobalRunHooks = require('./hooks');
const makeConfig = require('./config');
const {makeManagersStorage} = require('./makeManagersStorage');
const {startApp} = require('./app');
const {makeLogger} = require('@applitools/logger');
const makeStartServer = require('./server');

const {config, eyesConfig} = makeConfig();

const logger = makeLogger({level: config.showLogs ? 'info' : 'silent', label: 'eyes'});

const globalHooks = makeGlobalRunHooks();

const managersUtils = makeManagersStorage();

const app = startApp({managersUtils, logger});
const startServer = makeStartServer({app, logger});

module.exports = makePluginExport({startServer, eyesConfig, globalHooks});

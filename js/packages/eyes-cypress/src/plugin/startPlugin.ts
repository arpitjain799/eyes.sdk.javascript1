'use strict'
import makePluginExport from './pluginExport'
import setupNodeEvents from './setupNodeEvents'
import makeConfig from './config'
import makeStartServer from './server'
import {makeLogger} from '@applitools/logger'

const {config, eyesConfig} = makeConfig()
const logger = makeLogger({level: config.showLogs ? 'info' : 'silent', label: 'eyes'})

const startServer = makeStartServer({logger})

const pluginExport = makePluginExport({
  startServer,
  eyesConfig: Object.assign({}, eyesConfig, {appliConfFile: config}),
})

export const eyesPlugin = setupNodeEvents({
  startServer,
  eyesConfig: Object.assign({}, eyesConfig, {appliConfFile: config}),
})

export default pluginExport

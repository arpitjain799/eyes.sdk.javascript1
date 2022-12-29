#!/usr/bin/env node

import type {EGClientSettings} from './types'
import yargs, {type CommandBuilder, type ArgumentsCamelCase} from 'yargs'
import {makeEGClient} from './client'

export const builder: CommandBuilder<EGClientSettings> = yargs =>
  yargs
    .example([
      ['eg-client', 'Run EG client server on random port'],
      ['eg-client --port 8080', 'Run EG client server on port 8080'],
    ])
    .options({
      port: {
        description: 'run server on a specific port.',
        alias: 'p',
        type: 'number',
      },
      tunnelUrl: {
        description: 'run server with specific eg tunnel url.',
        alias: 'egTunnelUrl',
        type: 'string',
      },
      'proxy.url': {
        description: 'run server with specific proxy url.',
        alias: 'proxyUrl',
        type: 'string',
      },
      'proxy.username': {
        description: 'run server with specific proxy url username.',
        type: 'string',
      },
      'proxy.password': {
        description: 'run server with specific proxy url password.',
        type: 'string',
      },
      'capabilities.serverUrl': {
        description: 'run server with specific default eyes server url.',
        alias: 'eyesServerUrl',
        type: 'string',
      },
      'capabilities.apiKey': {
        description: 'run server with specific default api key.',
        alias: 'apiKey',
        type: 'string',
      },
      'capabilities.timeout': {
        description: 'run server with specific default eg timeout.',
        alias: ['egTimeout', 'timeout'],
        type: 'number',
      },
      'capabilities.inactivityTimeout': {
        description: 'run server with specific default eg inactivity timeout.',
        alias: ['egInactivityTimeout', 'inactivityTimeout'],
        type: 'number',
      },
    })

export const handler = async (settings: ArgumentsCamelCase<EGClientSettings>) => {
  const client = await makeEGClient({settings})
  console.log(client.url)
}

if (require.main === module) {
  yargs.command({command: '*', builder, handler}).wrap(yargs.terminalWidth()).argv
}

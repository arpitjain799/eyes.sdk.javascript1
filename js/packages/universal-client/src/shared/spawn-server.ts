import type {ChildProcess} from 'child_process'
import {fork} from 'child_process'
import {Socket} from './socket'
import type {Logger} from '@applitools/logger'

export type SpawnedServer = {server: ChildProcess; socket: Socket}

export async function spawnServer({logger}: {logger: Logger}): Promise<SpawnedServer> {
  return new Promise((resolve, _reject) => {
    const server = fork('./dist/cli.js', {
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    })

    const socket = new Socket()

    // specific to JS: we are able to listen to stdout for the first line, then we know the server is up, and we even can get its port in case it wasn't passed
    server.once('message', ({name, payload}: {name: string; payload: any}) => {
      if (name === 'port') {
        const {port} = payload
        logger.log('server is spawned at port', port)
        server.channel?.unref()
        socket.connect(`http://localhost:${port}/eyes`)
        socket.emit('Core.makeSDK', {
          name: 'eyes-universal-tests',
          version: require('../../package.json').version,
          protocol: 'webdriver',
          cwd: process.cwd(),
        })
        resolve({server, socket})
      }
    })

    // TODO without doing this, the parent process hangs and cannot exit.
    // But it creates issues:
    // (a) the server keeps running,
    // (b) the Node.js mocha process just exits because it doesn't know about anything to wait on.
    //     I solved it with an ugly hack of a large timeout that I set at the beginning and clear at the end. But it needs to be resolved somehow.
    server.unref()
    // socket.unref()
  })
}

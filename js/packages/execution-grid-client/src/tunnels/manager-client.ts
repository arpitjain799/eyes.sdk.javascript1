import {type Logger} from '@applitools/logger'
import {type TunnelManager, type TunnelManagerSettings} from './manager'
import {makeTunnelManagerServerProcess} from './manager-server'
import {makeSocket} from '@applitools/socket'
import {createConnection} from 'net'

export async function makeTunnelManagerClient({
  settings,
  logger,
}: {
  settings?: TunnelManagerSettings
  logger: Logger
}): Promise<TunnelManager> {
  logger = logger.extend({label: 'tunnel-manager-client'})
  const path =
    process.env.APPLITOOLS_TUNNEL_MANAGER_SOCK ||
    (process.platform === 'win32' ? '\\\\.\\pipe\\applitools-tunnel-manager' : '/tmp/applitools-tunnel-manager.sock')
  const socket = makeSocket(createConnection({path}), {transport: 'ipc', logger})
  socket.once('error', async (error: Error & {code: string}) => {
    if (['ECONNREFUSED', 'ENOENT'].includes(error.code)) {
      await makeTunnelManagerServerProcess({settings, path, unlink: error.code === 'ECONNREFUSED'})
      socket.use(createConnection({path}))
    }
  })

  socket.once('ready', () => socket.target.unref())
  socket.on('Logger.log', ({level, message}) => logger[level as 'info' | 'warn' | 'error' | 'fatal'](message))

  return {
    create: options => socket.request('Tunnel.create', options),
    destroy: options => socket.request('Tunnel.destroy', options),
    acquire: options => socket.request('Tunnel.acquire', options),
    release: options => socket.request('Tunnel.release', options),
  }
}

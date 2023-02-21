import {makeLogger, type Logger} from '@applitools/logger'
import {makeReq} from '@applitools/req'
//@ts-ignore
import makeTunnelServer from '@applitools/execution-grid-tunnel'

import * as utils from '@applitools/utils'

export interface TunnelManager {
  create(options: {credentials: TunnelCredentials; logger?: Logger}): Promise<Tunnel>
  destroy(options: {tunnel: Tunnel; logger?: Logger}): Promise<void>

  acquire(options: {credentials: TunnelCredentials; logger?: Logger}): Promise<Tunnel[]>
  release(options: {tunnels: Tunnel[]; logger?: Logger}): Promise<void>
}

export interface Tunnel {
  tunnelId: string
  credentials: TunnelCredentials
}

export interface TunnelCredentials {
  eyesServerUrl: string
  apiKey: string
}

export type TunnelManagerSettings = {
  serverUrl?: string
  groupSize?: number
  pool?: {
    maxInuse?: number
    timeout?: {idle?: number; expiration?: number}
  }
}

export async function makeTunnelManager({
  settings,
  logger,
}: {
  settings?: TunnelManagerSettings
  logger?: Logger
} = {}): Promise<TunnelManager & {cleanup(): Promise<void>}> {
  const defaultLogger = logger?.extend({label: 'tunnel-manager'}) ?? makeLogger({label: 'tunnel-manager'})
  let server: {port: number; close: () => Promise<void>} | undefined

  const req = makeReq({
    retry: {
      validate: async ({response}) => {
        if (!response) return false
        const body = await response
          .clone()
          .json()
          .catch(() => null)
        return ['CONCURRENCY_LIMIT_REACHED', 'NO_AVAILABLE_TUNNEL_PROXY'].includes(body?.message)
      },
      timeout: [
        ...Array(5).fill(2000), // 5 tries with delay 2s (total 10s)
        ...Array(4).fill(5000), // 4 tries with delay 5s (total 20s)
        10000, // all next tries with delay 10s
      ],
    },
  })

  const pools = new Map<string, Pool<Tunnel[], TunnelCredentials>>()

  return {create, destroy, acquire, release, cleanup}

  async function acquire({
    credentials,
    logger = defaultLogger,
  }: {
    credentials: TunnelCredentials
    logger?: Logger
  }): Promise<Tunnel[]> {
    const key = JSON.stringify(credentials)
    let pool = pools.get(key)!
    if (!pool) {
      pool = makePool({
        create: () => Promise.all(Array.from({length: settings?.groupSize ?? 1}, () => create({credentials, logger}))),
        destroy: tunnels => Promise.all(tunnels.map(tunnel => destroy({tunnel, logger}))).then(() => undefined),
        ...settings?.pool,
      })
      pools.set(key, pool)
    }

    return pool.acquire(credentials)
  }

  async function release({tunnels}: {tunnels: Tunnel[]; logger?: Logger}): Promise<void> {
    const key = JSON.stringify(tunnels[0].credentials)
    const pool = pools.get(key)!
    if (!pool) return
    await pool.release(tunnels)
  }

  async function create({
    credentials,
    logger = defaultLogger,
  }: {
    credentials: TunnelCredentials
    logger?: Logger
  }): Promise<Tunnel> {
    if (!settings?.serverUrl) {
      settings ??= {}
      settings.serverUrl = await open()
    }

    const response = await req('/tunnels', {
      method: 'POST',
      baseUrl: settings!.serverUrl,
      headers: {
        'x-eyes-api-key': credentials.apiKey,
        'x-eyes-server-url': credentials.eyesServerUrl,
      },
    })

    const body = await response.json().catch(() => null)
    if (response.status === 201) return {tunnelId: body, credentials}

    logger.error(`Failed to create tunnel with status ${response.status} and code ${body?.message ?? 'UNKNOWN_ERROR'}`)
    throw new Error(`Failed to create tunnel with code ${body?.message ?? 'UNKNOWN_ERROR'}`)
  }

  async function destroy({tunnel, logger = defaultLogger}: {tunnel: Tunnel; logger?: Logger}): Promise<void> {
    if (!settings?.serverUrl) {
      settings ??= {}
      settings.serverUrl = await open()
    }

    const response = await req(`/tunnels/${tunnel.tunnelId}`, {
      method: 'DELETE',
      baseUrl: settings!.serverUrl,
      headers: {
        'x-eyes-api-key': tunnel.credentials.apiKey,
        'x-eyes-server-url': tunnel.credentials.eyesServerUrl,
      },
    })

    const body = await response.json().catch(() => null)
    if (response.status === 200) return

    logger.error(`Failed to delete tunnel with status ${response.status} and code ${body?.message ?? 'UNKNOWN_ERROR'}`)
    throw new Error(`Failed to delete tunnel with code ${body?.message ?? 'UNKNOWN_ERROR'}`)
  }

  async function open(): Promise<string> {
    const {port, cleanupFunction} = await makeTunnelServer({logger})
    server = {port, close: cleanupFunction}
    return `http://localhost:${port}`
  }

  async function cleanup() {
    await server?.close()
  }
}

interface Pool<TResource, TResourceOptions> {
  acquire(options: TResourceOptions): Promise<TResource>
  get(): Promise<TResource | null>
  add(resource: TResource): Promise<void>
  use(resource: TResource): Promise<boolean>
  release(resource: TResource): Promise<boolean>
  destroy(resource: TResource): Promise<boolean>
}

interface PoolItem<TResource> {
  resource: TResource
  destroyed: boolean
  inuse: number
  expireAt: number
  timers?: {idle?: NodeJS.Timeout; expiration?: NodeJS.Timeout}
}

interface PoolOptions<TResource, TResourceOptions> {
  create(options: TResourceOptions): Promise<TResource>
  destroy(resource: TResource): Promise<void>
  maxInuse?: number
  timeout?: {idle?: number; expiration?: number}
}

function makePool<TResource, TResourceOptions = never>(
  options: PoolOptions<TResource, TResourceOptions>,
): Pool<TResource, TResourceOptions> {
  const pool = new Map<TResource, PoolItem<TResource>>()

  return {
    acquire,
    add,
    get,
    use,
    release,
    destroy,
  }

  async function acquire(resourceOptions: TResourceOptions): Promise<TResource> {
    let resource = await get()!
    if (!resource) {
      resource = await options.create(resourceOptions)
      await add(resource)
    }
    await use(resource)
    return resource
  }

  async function add(resource: TResource): Promise<void> {
    const item = {
      resource,
      destroyed: false,
      inuse: 0,
    } as PoolItem<TResource>
    if (options.timeout?.expiration) {
      item.timers ??= {}
      item.timers.expiration = setTimeout(() => destroy(resource), options.timeout.expiration)
      item.expireAt = Date.now() + options.timeout.expiration
    }
    pool.set(resource, item)
  }

  async function get(): Promise<TResource | null> {
    const freeItem = Array.from(pool.values()).reduce(
      (freeItem, item) =>
        !item.destroyed &&
        (!options.maxInuse || item.inuse < options.maxInuse) &&
        (!freeItem || freeItem.inuse > item.inuse)
          ? item
          : freeItem,
      null as PoolItem<TResource> | null,
    )
    return freeItem?.resource ?? null
  }

  async function use(resource: TResource): Promise<boolean> {
    const item = pool.get(resource)
    if (!item) return false
    if (item.timers?.idle) clearTimeout(item.timers?.idle)
    item.inuse += 1
    return true
  }

  async function release(resource: TResource): Promise<boolean> {
    const item = pool.get(resource)
    if (!item) return false
    item.inuse -= 1
    if (item.destroyed) await destroy(resource)
    else if (!utils.types.isNull(options.timeout?.idle) && item.inuse <= 0) {
      if (options.timeout!.idle > 0) {
        item.timers ??= {}
        item.timers.idle = setTimeout(() => destroy(resource), options.timeout!.idle)
      } else {
        await destroy(resource)
      }
    }
    return true
  }

  async function destroy(resource: TResource): Promise<boolean> {
    const item = pool.get(resource)
    if (!item) return false
    item.destroyed = true
    if (item.inuse > 0) return false
    if (item.timers?.idle) clearTimeout(item.timers?.idle)
    if (item.timers?.expiration) clearTimeout(item.timers?.expiration)
    await options.destroy(item.resource)
    return true
  }
}

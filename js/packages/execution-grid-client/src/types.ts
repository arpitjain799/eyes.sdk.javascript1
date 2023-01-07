import {type Server} from 'http'
import {type Proxy} from '@applitools/req'

export interface EGClient {
  readonly url: string
  readonly port: number
  readonly server: Server
}

export interface EGClientSettings {
  serverUrl?: string
  tunnelUrl?: string
  proxy?: Proxy
  port?: number
  capabilities?: EGCapabilities
  resolveUrls?: boolean
}

export interface EGCapabilities {
  eyesServerUrl?: string
  apiKey?: string
  timeout?: number | string
  inactivityTimeout?: number | string
  useSelfHealing?: boolean
}

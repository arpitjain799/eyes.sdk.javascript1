import {type Proxy} from '@applitools/req'
import {type Batch, type FunctionalSession} from '@applitools/core-base'
import {type Tunnel} from './tunnels/manager'

export interface ECClient {
  readonly url: string
  readonly port: number
  unref(): void
  close(): void
}

export interface ECClientSettings {
  serverUrl: string
  proxy?: Proxy
  options?: ECCapabilitiesOptions
  port?: number
  /** @internal */
  tunnel?: {
    serverUrl?: string
    groupSize?: number
    pool?: {
      maxInuse?: number
      timeout?: {idle?: number; expiration?: number}
    }
  }
}

export interface ECCapabilitiesOptions {
  eyesServerUrl?: string
  apiKey?: string
  sessionName?: string
  appName?: string
  testName?: string
  batch?: Batch
  useSelfHealing?: boolean
  tunnel?: boolean
  timeout?: number
  inactivityTimeout?: number
  requestDriverTimeout?: number
  selfHealingMaxRetryTime?: number
}

export interface ECSession {
  serverUrl: string
  sessionId: string
  proxy?: Proxy
  credentials: {
    eyesServerUrl: string
    apiKey: string
  }
  capabilities: Record<string, any>
  options: ECCapabilitiesOptions
  tunnels?: Tunnel[]
  metadata?: any[]
  tests?: {
    current?: FunctionalSession
    ended?: FunctionalSession[]
  }
}

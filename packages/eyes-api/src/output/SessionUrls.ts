import * as GeneralUtils from '../utils/GeneralUtils'

export type SessionUrls = {
  batch?: string
  session?: string
}

export default class SessionUrlsData implements Required<SessionUrls> {
  private _batch: string
  private _session: string

  constructor(sessionUrls?: SessionUrls) {
    if (!sessionUrls) return this
    this.batch = sessionUrls.batch
    this.session = sessionUrls.session
  }

  get batch(): string {
    return this._batch
  }
  set batch(batch: string) {
    this._batch = batch
  }
  getBatch(): string {
    return this._batch
  }
  setBatch(batch: string) {
    this.batch = batch
  }

  get session(): string {
    return this._session
  }
  set session(session: string) {
    this._session = session
  }
  getSession(): string {
    return this._session
  }
  setSession(session: string) {
    this.session = session
  }

  toJSON(): SessionUrls {
    return GeneralUtils.toJSON(this, ['batch', 'session'])
  }

  toString(): string {
    return `${this.constructor.name} ${JSON.stringify(this.toJSON(), null, 2)}`
  }
}

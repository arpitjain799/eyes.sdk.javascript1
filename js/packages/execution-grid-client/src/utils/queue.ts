import {type Logger} from '@applitools/logger'
import {AbortController, type AbortSignal} from 'abort-controller'
import * as utils from '@applitools/utils'

export type Queue = {
  readonly corked: boolean
  readonly pause: never
  run<TResult>(task: Task<TResult>): Promise<TResult>
  cancel(task: (signal: AbortSignal) => Promise<any>): void
  cork(): void
  uncork(): void
}

type Task<TResult> = (signal: AbortSignal) => Promise<TResult>

type Handle = {
  running: boolean
  start(): void
  resolve(result?: any): void
  reject(reason?: any): void
  abort(reason?: any): void
  promise: Promise<any>
  controller: AbortController
}

export function makeQueue({logger}: {logger: Logger}): Queue {
  const pool = [] as Handle[]
  const map = new Map<Task<any>, Handle>()
  let corked = false

  return {
    get corked() {
      return corked
    },
    pause: Symbol('pause queue') as never,
    run,
    cancel,
    cork,
    uncork,
  }

  async function run<TResult>(task: (signal: AbortSignal) => Promise<TResult>): Promise<TResult> {
    const handle = {} as Handle
    handle.running = false
    handle.start = async () => {
      if (handle.running) return
      handle.running = true
      handle.controller = new AbortController()
      try {
        const result = await task(handle.controller.signal)
        if (handle.running) {
          map.delete(task)
          pool.splice(pool.indexOf(handle), 1)
          handle.resolve(result)
        }
      } catch (error) {
        if (handle.running || !utils.types.instanceOf(error, 'AbortError')) handle.reject(error)
      } finally {
        return handle.promise
      }
    }
    handle.abort = () => {
      if (!handle.running) return
      handle.running = false
      handle.controller.abort()
    }
    handle.promise = new Promise<TResult>((resolve, reject) => {
      handle.resolve = resolve
      handle.reject = reject
    })

    pool.push(handle)
    map.set(task, handle)

    logger.log('Task was added to the queue')

    if (!corked) handle.start()

    return handle.promise
  }

  function cancel(task: (signal: AbortSignal) => Promise<any>): void {
    const handle = map.get(task)
    if (!handle?.running) return
    handle.abort()
    map.delete(task)
    pool.splice(pool.indexOf(handle), 1)
    logger.log('Task was cancelled')
  }

  function cork() {
    if (corked) return
    corked = true
    pool.slice(1).forEach(handle => handle.abort())
    logger.log('Queue was corked')
  }

  function uncork() {
    if (!corked) return
    corked = false
    pool.forEach(handle => handle.start())
    logger.log('Queue was uncorked')
  }
}

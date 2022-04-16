import type * as types from '@applitools/types'
import type {Driver, Element, Selector} from '@applitools/spec-driver-selenium'
import * as spec from '@applitools/spec-driver-selenium'
import * as utils from '@applitools/utils'

export {Driver, Element, Selector}
export type TransformedDriver = {sessionId: string; serverUrl: string; capabilities: Record<string, any>}
export type TransformedElement = {elementId: string}
export type TransformedSelector = types.Selector<never>

export async function transform(data: any, driverUrl?: string): Promise<any> {
  if (spec.isDriver(data)) {
    return transformDriver(data, driverUrl)
  } else if (spec.isElement(data)) {
    return transformElement(data)
  } else if (utils.types.isArray(data)) {
    return Promise.all(data.map(transform))
  } else if (utils.types.isObject(data)) {
    return Object.entries(data).reduce(async (data, [key, value]) => {
      const transformed = await transform(value)
      return data.then(data => Object.assign(data, {[key]: transformed}))
    }, Promise.resolve({}))
  } else {
    return data
  }
}

async function transformDriver(driver: Driver, driverUrl: string): Promise<TransformedDriver> {
  const session = await driver.getSession()
  const capabilities = await driver.getCapabilities()
  return {
    serverUrl: driverUrl,
    sessionId: session.getId(),
    capabilities: Array.from(capabilities.keys()).reduce((caps, key) => {
      caps[key] = capabilities.get(key)
      return caps
    }, {} as Record<string, any>),
  }
}

async function transformElement(element: Element): Promise<TransformedElement> {
  return {elementId: await element.getId()}
}

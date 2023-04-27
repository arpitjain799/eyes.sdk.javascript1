import type {Size} from '@applitools/utils'
import type {DriverInfo} from '../types'
import * as utils from '@applitools/utils'

export type Driver = any
export type Element = any
export type Selector = string | {using: string; value: string}
type CommonSelector = string | {selector: string; type?: string}

export function isDriver(driver: any): driver is Driver {
  return driver && driver.constructor.name === 'MockDriver'
}
export function isElement(element: any): element is Element {
  if (element?.notting === true) return false
  return utils.types.has(element, 'id')
}
export function isSelector(selector: any): selector is Selector {
  if (selector?.notting === true) return false
  return (
    utils.types.isString(selector) || utils.types.has(selector, ['using', 'value']) || selector?.forceSelector === true
  )
}
export function transformSelector(selector: Selector | {selector: Selector}): Selector {
  return utils.types.has(selector, 'selector') ? selector.selector : selector
}
export function untransformSelector(selector: Selector): CommonSelector | null {
  if (utils.types.isString(selector)) {
    return {type: 'css', selector: selector}
  } else if (utils.types.has(selector, ['using', 'value'])) {
    return {type: selector.using === 'css selector' ? 'css' : selector.using, selector: selector.value}
  } else if (utils.types.has(selector, ['selector'])) {
    return selector
  }
  return null
}
export function extractSelector(element: Element): any {
  if (utils.types.has(element, ['selector'])) {
    return element.selector
  }
}
export function isStaleElementError(): boolean {
  return false
}
export async function isEqualElements(_driver: Driver, element1: Element, element2: Element): Promise<boolean> {
  return element1.id === element2.id
}
export async function executeScript(driver: Driver, script: ((arg: any) => any) | string, arg: any): Promise<any> {
  return driver.executeScript(script, [arg])
}
export async function findElement(driver: Driver, selector: Selector, parent?: Element): Promise<Element | null> {
  return driver.findElement(selector, parent)
}
export async function findElements(driver: Driver, selector: Selector, parent?: Element): Promise<Element[]> {
  return driver.findElements(selector, parent)
}
export async function getElementText(_driver: Driver, element: Element): Promise<string> {
  return element.attrs?.text
}
export async function mainContext(driver: Driver): Promise<Driver> {
  return driver.switchToFrame(null)
}
export async function parentContext(driver: Driver): Promise<Driver> {
  return driver.switchToParentFrame()
}
export async function childContext(driver: Driver, element: Element): Promise<Driver> {
  return driver.switchToFrame(element)
}
export async function takeScreenshot(driver: Driver): Promise<Buffer | string> {
  return driver.takeScreenshot()
}
export async function getDriverInfo(driver: Driver): Promise<DriverInfo> {
  return {environment: driver.environment}
}
export async function getWindowSize(driver: Driver): Promise<Size> {
  return utils.geometry.size(await driver.getWindowRect())
}
export async function setWindowSize(driver: Driver, size: Size): Promise<void> {
  await driver.setWindowRect(size)
}
export async function getOrientation(_driver: Driver): Promise<'portrait' | 'landscape'> {
  return 'portrait'
}
export async function getUrl(driver: Driver): Promise<string> {
  if (driver._isNative) return ''
  return driver.getUrl()
}
export async function getTitle(driver: Driver): Promise<string> {
  if (driver._isNative) return ''
  return driver.getTitle()
}
export async function visit(driver: Driver, url: string): Promise<void> {
  await driver.visit(url)
}

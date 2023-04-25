/* eslint @typescript-eslint/ban-types: ["error", {"types": {"Function": false}}] */
import type {Size, Region} from '@applitools/utils'
import type {
  SpecType as BaseSpecType,
  CommonSelector,
  Cookie,
  DriverInfo,
  WaitOptions,
  ScreenOrientation,
} from '@applitools/driver'
import {Command} from 'selenium-webdriver/lib/command'
import * as Selenium from 'selenium-webdriver'
import * as utils from '@applitools/utils'

type ApplitoolsBrand = {__applitoolsBrand?: never}

export type Driver = Selenium.WebDriver & ApplitoolsBrand
export type Element = Selenium.WebElement & ApplitoolsBrand
export type ShadowRoot = {'shadow-6066-11e4-a52e-4f735466cecf': string}
export type Selector = (
  | Exclude<Selenium.Locator, Function>
  | ((webdriver: Selenium.WebDriver) => Promise<any>)
  | {using: string; value: string}
) &
  ApplitoolsBrand
export type SpecType = BaseSpecType<Driver, Driver, Element, Selector>

// #region HELPERS

const byHash = ['className', 'css', 'id', 'js', 'linkText', 'name', 'partialLinkText', 'tagName', 'xpath'] as const

function extractElementId(element: Element | ShadowRoot): Promise<string> | string {
  return isElement(element) ? (element.getId() as Promise<string>) : element['shadow-6066-11e4-a52e-4f735466cecf']
}
function transformShadowRoot(driver: Driver, shadowRoot: ShadowRoot | Element): Element {
  return utils.types.has(shadowRoot, 'shadow-6066-11e4-a52e-4f735466cecf')
    ? new Selenium.WebElement(driver, shadowRoot['shadow-6066-11e4-a52e-4f735466cecf'])
    : shadowRoot
}
function isByHashSelector(selector: any): selector is Selenium.ByHash {
  return byHash.includes(Object.keys(selector)[0] as (typeof byHash)[number])
}
async function executeCustomCommand(driver: Driver, command: Command) {
  return process.env.APPLITOOLS_SELENIUM_MAJOR_VERSION === '3'
    ? (driver as any).schedule(command)
    : driver.execute(command)
}

// #endregion

// #region UTILITY

export function isDriver(driver: any): driver is Driver {
  return utils.types.instanceOf(driver, 'WebDriver')
}
export function isElement(element: any): element is Element {
  return utils.types.instanceOf(element, 'WebElement')
}
export function isSelector(selector: any): selector is Selector {
  if (!selector) return false
  return (
    utils.types.has(selector, ['using', 'value']) ||
    isByHashSelector(selector) ||
    utils.types.isFunction(selector) ||
    utils.types.instanceOf<Selenium.RelativeBy>(selector, 'RelativeBy')
  )
}
export function transformDriver(driver: Driver): Driver {
  driver.getExecutor().defineCommand('getSessionDetails', 'GET', '/session/:sessionId')
  driver.getExecutor().defineCommand('getOrientation', 'GET', '/session/:sessionId/orientation')
  driver.getExecutor().defineCommand('getSystemBars', 'GET', '/session/:sessionId/appium/device/system_bars')
  driver.getExecutor().defineCommand('getWindowSize', 'GET', '/session/:sessionId/window/current/size')
  driver.getExecutor().defineCommand('setWindowSize', 'POST', '/session/:sessionId/window/current/size')
  driver.getExecutor().defineCommand('setWindowPosition', 'POST', '/session/:sessionId/window/current/position')
  driver.getExecutor().defineCommand('performTouch', 'POST', '/session/:sessionId/touch/perform')
  driver.getExecutor().defineCommand('executeCdp', 'POST', '/session/:sessionId/chromium/send_command_and_get_result')
  driver.getExecutor().defineCommand('setOrientation', 'POST', '/session/:sessionId/orientation')
  driver.getExecutor().defineCommand('getCurrentContext', 'GET', '/session/:sessionId/context')
  driver.getExecutor().defineCommand('getContexts', 'GET', '/session/:sessionId/contexts')
  driver.getExecutor().defineCommand('switchToContext', 'POST', '/session/:sessionId/context')

  if (process.env.APPLITOOLS_SELENIUM_MAJOR_VERSION === '3') {
    driver.getExecutor().defineCommand('switchToParentFrame', 'POST', '/session/:sessionId/frame/parent')
  }
  return driver
}
export function transformSelector(selector: CommonSelector<Selector>): Selector {
  if (utils.types.isString(selector)) {
    return {css: selector}
  } else if (utils.types.has(selector, 'selector')) {
    if (!utils.types.isString(selector.selector)) return selector.selector
    if (!utils.types.has(selector, 'type') || !selector.type) return {css: selector.selector}
    if (selector.type === 'css') return {css: selector.selector}
    else return {using: selector.type, value: selector.selector}
  }
  return selector
}

export function untransformSelector(selector: Selector): CommonSelector | null {
  if (utils.types.instanceOf<Selenium.RelativeBy>(selector, 'RelativeBy') || utils.types.isFunction(selector)) {
    return null
  } else if (isByHashSelector(selector)) {
    const [[how, what]] = Object.entries(selector) as [[(typeof byHash)[number], string]]
    if (how === 'js') return null
    selector = Selenium.By[how](what)
  }
  if (utils.types.has(selector, ['using', 'value'])) {
    return {type: selector.using === 'css selector' ? 'css' : selector.using, selector: selector.value}
  }
  return selector
}
export function isStaleElementError(error: any): boolean {
  if (!error) return false
  error = error.originalError || error
  return error instanceof Error && error.name === 'StaleElementReferenceError'
}
export async function isEqualElements(_driver: Driver, element1: Element, element2: Element): Promise<boolean> {
  if (!element1 || !element2) return false
  const elementId1 = await extractElementId(element1)
  const elementId2 = await extractElementId(element2)
  return elementId1 === elementId2
}

// #endregion

// #region COMMANDS

export async function executeScript(driver: Driver, script: ((arg: any) => any) | string, arg: any): Promise<any> {
  return driver.executeScript(script, arg)
}
export async function mainContext(driver: Driver): Promise<Driver> {
  await driver.switchTo().defaultContent()
  return driver
}
export async function parentContext(driver: Driver): Promise<Driver> {
  if (process.env.APPLITOOLS_SELENIUM_MAJOR_VERSION === '3') {
    await executeCustomCommand(driver, new Command('switchToParentFrame'))
    return driver
  }
  await driver.switchTo().parentFrame()
  return driver
}
export async function childContext(driver: Driver, element: Element): Promise<Driver> {
  await driver.switchTo().frame(element)
  return driver
}

export async function findElement(driver: Driver, selector: Selector, parent?: Element): Promise<Element | null> {
  try {
    const root = parent ? transformShadowRoot(driver, parent) : driver
    return await root.findElement(selector as Selenium.Locator)
  } catch (err: any) {
    if (err.name === 'NoSuchElementError') return null
    else throw err
  }
}
export async function findElements(driver: Driver, selector: Selector, parent?: Element): Promise<Element[]> {
  const root = parent ? transformShadowRoot(driver, parent) : driver
  return root.findElements(selector as Selenium.Locator)
}
export async function waitForSelector(
  driver: Driver,
  selector: Selector,
  _parent?: Element,
  options?: WaitOptions,
): Promise<Element | null> {
  if (options?.state === 'visible') {
    const element = await driver.findElement(selector as Selenium.Locator)
    return driver.wait(Selenium.until.elementIsVisible(element), options?.timeout)
  } else {
    return driver.wait(Selenium.until.elementLocated(selector as Selenium.Locator), options?.timeout)
  }
}
export async function setElementText(driver: Driver, element: Element | Selector, keys: string): Promise<void> {
  const resolvedElement = isSelector(element) ? await findElement(driver, element) : element
  await resolvedElement?.clear()
  await resolvedElement?.sendKeys(keys)
}
export async function getElementText(_driver: Driver, element: Element): Promise<string> {
  return element.getText()
}
export async function getWindowSize(driver: Driver): Promise<Size> {
  try {
    const rect = await driver.manage().window().getRect()
    return {width: rect.width, height: rect.height}
  } catch {
    const size: any = driver.manage().window().getSize
      ? await driver.manage().window().getSize()
      : await executeCustomCommand(driver, new Command('getWindowSize'))
    return {width: size.width, height: size.height}
  }
}
export async function setWindowSize(driver: Driver, size: Size) {
  try {
    await driver.manage().window().setRect({x: 0, y: 0, width: size.width, height: size.height})
  } catch {
    if (driver.manage().window().setPosition) await driver.manage().window().setPosition(0, 0)
    else await executeCustomCommand(driver, new Command('setWindowPosition').setParameters({x: 0, y: 0}))
    if (driver.manage().window().setSize) await driver.manage().window().setSize(size.width, size.height)
    else await executeCustomCommand(driver, new Command('setWindowSize').setParameters({...size}))
  }
}
export async function getCookies(driver: Driver, context?: boolean): Promise<Cookie[]> {
  if (context) return driver.manage().getCookies()

  let cookies
  if (utils.types.isFunction(driver, 'sendAndGetDevToolsCommand')) {
    const response = await driver.sendAndGetDevToolsCommand('Network.getAllCookies')
    cookies = response.cookies
  } else {
    const response = await executeCustomCommand(
      driver,
      new Command('executeCdp').setParameter('cmd', 'Network.getAllCookies').setParameter('params', {}),
    )
    cookies = response.cookies
  }

  return cookies.map((cookie: any) => {
    const copy = {...cookie, expiry: cookie.expires}
    delete copy.expires
    delete copy.size
    delete copy.priority
    delete copy.session
    delete copy.sameParty
    delete copy.sourceScheme
    delete copy.sourcePort
    return copy
  })
}
export async function getDriverInfo(driver: Driver): Promise<DriverInfo> {
  const session = await driver.getSession()
  return {sessionId: session.getId()}
}
export async function getCapabilities(driver: Driver): Promise<Record<string, any>> {
  return (
    (await executeCustomCommand(driver, new Command('getSessionDetails')).catch(() => null)) ??
    (await driver
      .getCapabilities()
      .then(capabilities =>
        Array.from(capabilities.keys()).reduce((obj, key) => Object.assign(obj, {[key]: capabilities.get(key)}), {}),
      ))
  )
}
export async function getTitle(driver: Driver): Promise<string> {
  return driver.getTitle()
}
export async function getUrl(driver: Driver): Promise<string> {
  return driver.getCurrentUrl()
}
export async function visit(driver: Driver, url: string): Promise<void> {
  await driver.get(url)
}
export async function takeScreenshot(driver: Driver): Promise<string> {
  return driver.takeScreenshot()
}
export async function click(driver: Driver, element: Element | Selector): Promise<void> {
  const resolvedElement = isSelector(element) ? await findElement(driver, element) : element
  await resolvedElement?.click()
}
export async function hover(driver: Driver, element: Element | Selector) {
  const resolvedElement = isSelector(element) ? await findElement(driver, element) : element
  if (process.env.APPLITOOLS_SELENIUM_MAJOR_VERSION === '3') {
    const {ActionSequence} = require('selenium-webdriver')
    const action = new ActionSequence(driver)
    await action.mouseMove(resolvedElement).perform()
  } else {
    await driver.actions().move({origin: resolvedElement!}).perform()
  }
}
export async function waitUntilDisplayed(driver: Driver, selector: Selector, timeout: number): Promise<void> {
  const element = await findElement(driver, selector)
  await driver.wait(Selenium.until.elementIsVisible(element!), timeout)
}

// #endregion

// #region MOBILE COMMANDS
export async function getSystemBars(driver: Driver): Promise<{
  statusBar: {visible: boolean; x: number; y: number; height: number; width: number}
  navigationBar: {visible: boolean; x: number; y: number; height: number; width: number}
}> {
  return executeCustomCommand(driver, new Command('getSystemBars'))
}

export async function setOrientation(driver: Driver, orientation: ScreenOrientation) {
  await executeCustomCommand(driver, new Command('setOrientation').setParameters({orientation}))
}

export async function getOrientation(driver: Driver): Promise<'portrait' | 'landscape'> {
  const orientation = await executeCustomCommand(driver, new Command('getOrientation'))
  return orientation.toLowerCase() as 'portrait' | 'landscape'
}
export async function getElementRegion(_driver: Driver, element: Element): Promise<Region> {
  if (utils.types.isFunction(element.getRect)) {
    return element.getRect()
  } else {
    const {x, y} = await element.getLocation()
    const {width, height} = await element.getSize()
    return {x, y, width, height}
  }
}
export async function getElementAttribute(_driver: Driver, element: Element, attr: string): Promise<string> {
  return element.getAttribute(attr)
}
export async function performAction(driver: Driver, steps: any[]): Promise<void> {
  await executeCustomCommand(
    driver,
    new Command('performTouch').setParameters({
      actions: steps.map(({action, ...options}) => ({action, options})),
    }),
  )
}
export async function getCurrentWorld(driver: Driver): Promise<string> {
  return executeCustomCommand(driver, new Command('getCurrentContext'))
}
export async function getWorlds(driver: Driver): Promise<string[]> {
  return executeCustomCommand(driver, new Command('getContexts'))
}
export async function switchWorld(driver: Driver, name: string): Promise<void> {
  return executeCustomCommand(driver, new Command('switchToContext').setParameters({name}))
}

// #endregion

// #region TESTING

const browserOptionsNames: Record<string, string> = {
  chrome: 'goog:chromeOptions',
  firefox: 'moz:firefoxOptions',
}
/*
 * Spawn a browser with a given configuration (INTERNAL USE ONLY)
 *
 * NOTE:
 * This function is intended for internal use only. As a result it relies on some dev dependencies.
 * When wiring the spec-driver up to an SDK and calling this function, if you don't have the same dev deps
 * installed in the SDK, then this function will error.
 */
export async function build({selenium, ...env}: any): Promise<[Driver & {__serverUrl?: string}, () => Promise<void>]> {
  const {Builder} = (selenium ?? require('selenium-webdriver')) as typeof Selenium
  const parseEnv = require('@applitools/test-utils/src/parse-env')

  const {
    browser,
    capabilities,
    url,
    attach,
    proxy,
    configurable = true,
    appium = false,
    args = [],
    headless,
  } = parseEnv({...env, legacy: env.legacy ?? process.env.APPLITOOLS_SELENIUM_MAJOR_VERSION === '3'})
  const desiredCapabilities = {...capabilities}
  if (configurable) {
    const browserOptionsName = browserOptionsNames[browser || desiredCapabilities.browserName]
    if (browserOptionsName) {
      const browserOptions = desiredCapabilities[browserOptionsName] || {}
      browserOptions.args = [...(browserOptions.args || []), ...args]
      if (headless) browserOptions.args.push('headless')
      if (attach) {
        browserOptions.debuggerAddress = attach === true ? 'localhost:9222' : attach
        if (browser !== 'firefox') browserOptions.w3c = false
      }
      desiredCapabilities[browserOptionsName] = browserOptions
    }
  }
  if (browser === 'chrome') {
    if (appium) {
      desiredCapabilities['appium:chromeOptions'] = {w3c: false, ...desiredCapabilities['appium:chromeOptions']}
    } else if (process.env.APPLITOOLS_SELENIUM_MAJOR_VERSION === '3') {
      desiredCapabilities['goog:chromeOptions'] = {w3c: false, ...desiredCapabilities['goog:chromeOptions']}
    }
  }
  const builder = new Builder().withCapabilities(desiredCapabilities)
  if (url && !attach) builder.usingServer(url.href)
  if (proxy) {
    builder.setProxy({
      proxyType: 'manual',
      httpProxy: proxy.http || proxy.server,
      sslProxy: proxy.https || proxy.server,
      ftpProxy: proxy.ftp,
      noProxy: proxy.bypass,
    })
  }
  const driver: Driver & {__serverUrl?: string} = await builder.build()
  driver.__serverUrl = url
  return [driver, () => driver.quit()]
}

// #endregion

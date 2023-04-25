import type {Size} from '@applitools/utils'
import {type Cookie} from '@applitools/driver'
import assert from 'assert'
import * as spec from '../../src'
import * as utils from '@applitools/utils'

function extractElementId(element: any) {
  return element.elementId || element['element-6066-11e4-a52e-4f735466cecf'] || element.ELEMENT
}

function equalElements(browser: spec.Driver, element1: spec.Element, element2: spec.Element): Promise<boolean> {
  return browser.execute((element1, element2) => element1 === element2, element1, element2).catch(() => false)
}

describe('spec driver', async () => {
  let browser: spec.Driver, destroyBrowser: () => void
  const url = 'https://applitools.github.io/demo/TestPages/FramesTestPage/'

  describe('headless desktop (@puppeteer)', async () => {
    before(function () {
      if (Number(process.env.APPLITOOLS_WEBDRIVERIO_MAJOR_VERSION) < 7) this.skip()
    })

    before(async () => {
      ;[browser, destroyBrowser] = await spec.build({browser: 'chrome', protocol: 'cdp'})
      await browser.url(url)
    })

    after(async () => {
      if (destroyBrowser) await destroyBrowser()
      destroyBrowser = null as any
    })

    it('isDriver(driver)', async () => {
      await isDriver({input: browser, expected: true})
    })
    it('isDriver(wrong)', async () => {
      await isDriver({input: {} as spec.Driver, expected: false})
    })
    it('isElement(element)', async () => {
      await isElement({input: await browser.findElement('css selector', 'div'), expected: true})
    })
    it('isElement(extended-element)', async () => {
      await isElement({input: await browser.$('div'), expected: true})
    })
    it('isElement(wrong)', async () => {
      await isElement({input: {} as spec.Element, expected: false})
    })
    it('isSelector(string)', async () => {
      await isSelector({input: 'div', expected: true})
    })
    it('isSelector(function)', async () => {
      await isSelector({input: () => null as any, expected: true})
    })
    it('isSelector(by)', async () => {
      await isSelector({input: {using: 'xpath', value: '//div'}, expected: true})
    })
    it('isSelector(wrong)', async () => {
      await isSelector({input: {} as spec.Selector, expected: false})
    })
    it('transformElement(element)', async () => {
      await transformElement({input: await browser.findElement('css selector', 'div')})
    })
    it('transformElement(extended-element)', async () => {
      await transformElement({input: await browser.$('div')})
    })
    it('transformSelector(string)', async () => {
      await transformSelector({input: '.element', expected: '.element'})
    })
    it('transformSelector(function)', async () => {
      const func = (): any => null
      await transformSelector({input: func, expected: func})
    })
    it('transformSelector(by)', async () => {
      const by = {using: 'xpath', value: '//div'}
      await transformSelector({input: by, expected: by})
    })
    it('transformSelector(common-selector)', async () => {
      await transformSelector({
        input: {selector: '.element', type: 'css'},
        expected: 'css selector:.element',
      })
    })
    it('untransformSelector(string)', async () => {
      await untransformSelector({input: '.element', expected: {selector: '.element'}})
    })
    it('untransformSelector(direct-string)', async () => {
      await untransformSelector({input: 'css selector:.element', expected: {type: 'css', selector: '.element'}})
    })
    it('untransformSelector(function)', async () => {
      await untransformSelector({input: () => null as any, expected: null})
    })
    it('untransformSelector(by)', async () => {
      await untransformSelector({input: {using: 'xpath', value: '//div'}, expected: {type: 'xpath', selector: '//div'}})
    })
    it('untransformSelector(common-selector)', async () => {
      const selector = {selector: '.element', type: 'css'}
      await untransformSelector({input: selector as any, expected: selector})
    })
    it('extractSelector(element)', async () => {
      await extractSelector({
        input: await browser.findElement('css selector', 'div'),
        expected: undefined,
      })
    })
    it('extractSelector(extended-element)', async () => {
      await extractSelector({input: await browser.$('div'), expected: 'div'})
    })
    it('executeScript(strings, args)', async () => {
      await executeScript()
    })
    it('mainContext()', async () => {
      await mainContext()
    })
    it('parentContext()', async () => {
      await parentContext()
    })
    it('childContext(element)', async () => {
      await childContext()
    })
    it('findElement(string)', async () => {
      await findElement({input: {selector: '#overflowing-div'}})
    })
    it('findElement(function)', async () => {
      const selector = function (this: Window) {
        return this.document.getElementById('overflowing-div')!
      }
      await findElement({input: {selector}})
    })
    it('findElement(non-existent)', async () => {
      await findElement({input: {selector: 'non-existent'}, expected: null})
    })
    it('findElement(within-element)', async () => {
      await findElement({input: {selector: 'div', parent: await browser.$('#stretched')}})
    })
    it('findElements(string)', async () => {
      await findElements({input: {selector: 'div'}})
    })
    it('findElements(function)', async () => {
      const selector = function (this: Window) {
        return Array.from(this.document.querySelectorAll('div'))
      }
      await findElements({input: {selector}})
    })
    it('findElements(non-existent)', async () => {
      await findElements({input: {selector: 'non-existent'}, expected: []})
    })
    it('findElements(within-element)', async () => {
      await findElements({input: {selector: 'div', parent: await browser.$('#stretched')}})
    })
    it('setElementText(element, text)', async () => {
      await setElementText({input: {element: await browser.$('input'), text: 'Ad multos annos'}})
    })
    it('takeScreenshot()', async () => {
      await takeScreenshot()
    })
    it('getWindowSize()', async () => {
      await getWindowSize()
    })
    it('setWindowSize({width, height})', async () => {
      await setWindowSize({input: {width: 551, height: 552}})
    })
    it('getCookies()', async () => {
      await getCookies()
    })
    it('getTitle()', async () => {
      await getTitle()
    })
    it('getUrl()', async () => {
      await getUrl()
    })
    it('visit()', async () => {
      await visit()
    })
  })

  describe('headless desktop (@webdriver)', async () => {
    before(function () {
      if (process.env.APPLITOOLS_WEBDRIVERIO_PROTOCOL === 'cdp') this.skip()
    })

    before(async () => {
      ;[browser, destroyBrowser] = await spec.build({browser: 'chrome'})
      await browser.url(url)
    })

    after(async () => {
      if (destroyBrowser) await destroyBrowser()
      destroyBrowser = null as any
    })

    it('isDriver(driver)', async () => {
      await isDriver({input: browser, expected: true})
    })
    it('isDriver(wrong)', async () => {
      await isDriver({input: {} as spec.Driver, expected: false})
    })
    it('isElement(element)', async () => {
      await isElement({input: await browser.findElement('css selector', 'div'), expected: true})
    })
    it('isElement(extended-element)', async () => {
      await isElement({input: await browser.$('div'), expected: true})
    })
    it('isElement(wrong)', async () => {
      await isElement({input: {} as spec.Element, expected: false})
    })
    it('isSelector(string)', async () => {
      await isSelector({input: 'div', expected: true})
    })
    it('isSelector(function)', async () => {
      await isSelector({input: () => null as any, expected: true})
    })
    it('isSelector(by)', async () => {
      await isSelector({input: {using: 'xpath', value: '//div'}, expected: true})
    })
    it('isSelector(wrong)', async () => {
      await isSelector({input: {} as spec.Selector, expected: false})
    })
    it('transformElement(element)', async () => {
      await transformElement({input: await browser.findElement('css selector', 'div')})
    })
    it('transformElement(extended-element)', async () => {
      await transformElement({input: await browser.$('div')})
    })
    it('transformSelector(string)', async () => {
      await transformSelector({input: '.element', expected: '.element'})
    })
    it('transformSelector(function)', async () => {
      const func = (): any => null
      await transformSelector({input: func, expected: func})
    })
    it('transformSelector(by)', async () => {
      const by = {using: 'xpath', value: '//div'}
      await transformSelector({input: by, expected: by})
    })
    it('transformSelector(common-selector)', async () => {
      await transformSelector({
        input: {selector: '.element', type: 'css'},
        expected: 'css selector:.element',
      })
    })
    it('untransformSelector(string)', async () => {
      await untransformSelector({input: '.element', expected: {selector: '.element'}})
    })
    it('untransformSelector(direct-string)', async () => {
      await untransformSelector({input: 'css selector:.element', expected: {type: 'css', selector: '.element'}})
    })
    it('untransformSelector(by)', async () => {
      await untransformSelector({input: () => null as any, expected: null})
    })
    it('untransformSelector(by)', async () => {
      await untransformSelector({input: {using: 'xpath', value: '//div'}, expected: {type: 'xpath', selector: '//div'}})
    })
    it('untransformSelector(common-selector)', async () => {
      const selector = {selector: '.element', type: 'css'}
      await untransformSelector({input: selector as any, expected: selector})
    })
    it('extractSelector(element)', async () => {
      await extractSelector({
        input: await browser.findElement('css selector', 'div'),
        expected: undefined,
      })
    })
    it('extractSelector(extended-element)', async () => {
      await extractSelector({input: await browser.$('div'), expected: 'div'})
    })
    it('isEqualElements(element, element)', async () => {
      await isEqualElements({
        input: {element1: await browser.$('div'), element2: await browser.$('div')},
        expected: true,
      })
    })
    it('isEqualElements(element1, element2)', async () => {
      isEqualElements({
        input: {element1: await browser.$('div'), element2: await browser.$('h1')},
        expected: false,
      })
    })
    it('mainContext()', async () => {
      await mainContext()
    })
    it('parentContext()', async () => {
      await parentContext()
    })
    it('childContext(element)', async () => {
      await childContext()
    })
    it('executeScript(strings, args)', async () => {
      await executeScript()
    })
    it('findElement(string)', async () => {
      await findElement({input: {selector: '#overflowing-div'}})
    })
    it('findElement(function)', async () => {
      const selector = function (this: Window) {
        return this.document.getElementById('overflowing-div')!
      }
      await findElement({input: {selector}})
    })
    it('findElement(within-element)', async () => {
      await findElement({input: {selector: 'div', parent: await browser.$('#stretched')}})
    })
    it('findElement(non-existent)', async () => {
      await findElement({input: {selector: 'non-existent'}, expected: null})
    })
    it('findElements(string)', async () => {
      await findElements({input: {selector: 'div'}})
    })
    it('findElements(function)', async () => {
      const selector = function (this: Window) {
        return this.document.getElementById('overflowing-div')!
      }
      await findElements({input: {selector}})
    })
    it('findElements(within-element)', async () => {
      await findElements({input: {selector: 'div', parent: await browser.$('#stretched')}})
    })
    it('findElements(non-existent)', async () => {
      await findElements({input: {selector: 'non-existent'}, expected: []})
    })
    it('takeScreenshot()', async () => {
      await takeScreenshot()
    })
    it('setElementText(element, text)', async () => {
      await setElementText({input: {element: await browser.$('input'), text: 'Ad multos annos'}})
    })
    it('getWindowSize()', async () => {
      await getWindowSize()
    })
    it('setWindowSize({width, height})', async () => {
      await setWindowSize({input: {width: 551, height: 552}})
    })
    it('getCookies()', async () => {
      await getCookies()
    })
    it('getCookies(context)', async () => {
      await getCookies({input: {context: true}})
    })
    it('getTitle()', async () => {
      await getTitle()
    })
    it('getUrl()', async () => {
      await getUrl()
    })
    it('visit()', async () => {
      await visit()
    })
  })

  describe('legacy browser (@webdriver)', async () => {
    before(function () {
      if (process.env.APPLITOOLS_WEBDRIVERIO_PROTOCOL === 'cdp') this.skip()
    })

    before(async () => {
      ;[browser, destroyBrowser] = await spec.build({browser: 'ie-11', legacy: true})
    })

    after(async () => {
      if (destroyBrowser) await destroyBrowser()
      destroyBrowser = null as any
    })

    it('getWindowSize()', async () => {
      await getWindowSize({legacy: true})
    })
    it('setWindowSize({width, height})', async () => {
      await setWindowSize({legacy: true, input: {width: 551, height: 552}})
    })
  })

  describe('mobile browser (@mobile)', async () => {
    before(function () {
      if (process.env.APPLITOOLS_WEBDRIVERIO_PROTOCOL === 'cdp') this.skip()
    })

    before(async () => {
      ;[browser, destroyBrowser] = await spec.build({
        browser: 'chrome',
        device: 'Pixel 3a XL',
        orientation: 'landscape',
      })
      await browser.url(url)
    })

    after(async () => {
      if (destroyBrowser) await destroyBrowser()
      destroyBrowser = null as any
    })

    it('getWindowSize()', async () => {
      await getWindowSize()
    })
    it('getCookies(context)', async () => {
      await getCookies({input: {context: true}})
    })
    it('getOrientation()', async () => {
      await getOrientation({expected: 'landscape'})
    })
  })

  describe('native app (@mobile @native)', async () => {
    before(function () {
      if (process.env.APPLITOOLS_WEBDRIVERIO_PROTOCOL === 'cdp') this.skip()
    })

    before(async () => {
      ;[browser, destroyBrowser] = await spec.build({
        app: 'https://applitools.jfrog.io/artifactory/Examples/android/1.3/app-debug.apk',
        device: 'Pixel 3a XL',
      })
      await spec.click(browser, {using: 'id', value: 'com.applitools.eyes.android:id/btn_web_view'})
      await utils.general.sleep(5000)
    })

    after(async () => {
      if (destroyBrowser) await destroyBrowser()
      destroyBrowser = null as any
    })

    it('getWindowSize()', async () => {
      await getWindowSize()
    })
    it('getOrientation()', async () => {
      await getOrientation({expected: 'portrait'})
    })
    it('getCurrentWorld()', async () => {
      await getCurrentWorld()
    })
    it('getWorlds()', async () => {
      await getWorlds()
    })
    it('switchWorld(name)', async () => {
      await switchWorld({input: {name: 'WEBVIEW_com.applitools.eyes.android'}})
    })
    it('extractHostName()', async () => {
      ;[browser, destroyBrowser] = await spec.build({browser: 'chrome-mac', protocol: 'wd'})
      await browser.url(url)

      extractHostName({expected: 'ondemand.us-west-1.saucelabs.com'})
    })
  })

  async function isDriver({input, expected}: {input: spec.Driver; expected: boolean}) {
    const result = await spec.isDriver(input)
    assert.strictEqual(result, expected)
  }
  async function isElement({input, expected}: {input: spec.Element; expected: boolean}) {
    const result = await spec.isElement(input)
    assert.strictEqual(result, expected)
  }
  async function isSelector({input, expected}: {input: spec.Selector; expected: boolean}) {
    const result = await spec.isSelector(input)
    assert.strictEqual(result, expected)
  }
  async function isEqualElements({
    input,
    expected,
  }: {
    input: {element1: spec.Element; element2: spec.Element}
    expected: boolean
  }) {
    const result = await spec.isEqualElements(browser, input.element1, input.element2)
    assert.deepStrictEqual(result, expected)
  }
  async function transformElement({input}: {input: spec.Element}) {
    const result = spec.transformElement(input)
    const elementId = extractElementId(input)
    assert.deepStrictEqual(result, {
      ELEMENT: elementId,
      'element-6066-11e4-a52e-4f735466cecf': elementId,
    })
  }
  async function transformSelector({input, expected}: {input: any; expected: spec.Selector}) {
    const result = spec.transformSelector(input)
    assert.deepStrictEqual(result, expected)
  }
  async function untransformSelector({
    input,
    expected,
  }: {
    input: spec.Selector
    expected: {type?: string; selector: string} | string | null
  }) {
    assert.deepStrictEqual(spec.untransformSelector(input), expected)
  }
  async function extractSelector({input, expected}: {input: spec.Element; expected: spec.Selector | undefined}) {
    const selector = spec.extractSelector(input)
    assert.deepStrictEqual(selector, expected)
  }
  async function executeScript() {
    const element = await browser.$('html')
    const args = [0, 'string', {key: 'value'}, [0, 1, 2, 3]]
    const [resultElement, ...resultArgs] = await spec.executeScript(browser, 'return arguments[0]', [element, ...args])
    assert.deepStrictEqual(resultArgs, args)
    assert.ok(await equalElements(browser, resultElement, element))
  }
  async function mainContext() {
    try {
      const mainDocument = await browser.$('html')
      await browser.switchToFrame(await browser.findElement('css selector', '[name="frame1"]'))
      await browser.switchToFrame(await browser.findElement('css selector', '[name="frame1-1"]'))
      const frameDocument = await browser.$('html')
      assert.ok(!(await equalElements(browser, mainDocument, frameDocument)))
      await spec.mainContext(browser)
      const resultDocument = await browser.$('html')
      assert.ok(await equalElements(browser, resultDocument, mainDocument))
    } finally {
      await browser.switchToFrame(null).catch(() => null)
    }
  }
  async function parentContext() {
    try {
      await browser.switchToFrame(await browser.findElement('css selector', '[name="frame1"]'))
      const parentDocument = await browser.$('html')
      await browser.switchToFrame(await browser.findElement('css selector', '[name="frame1-1"]'))
      const frameDocument = await browser.$('html')
      assert.ok(!(await equalElements(browser, parentDocument, frameDocument)))
      await spec.parentContext(browser)
      const resultDocument = await browser.$('html')
      assert.ok(await equalElements(browser, resultDocument, parentDocument))
    } finally {
      await browser.switchToFrame(null).catch(() => null)
    }
  }
  async function childContext() {
    try {
      const element = await browser.findElement('css selector', '[name="frame1"]')
      await browser.switchToFrame(element)
      const expectedDocument = await browser.$('html')
      await browser.switchToFrame(null)
      await spec.childContext(browser, element)
      const resultDocument = await browser.$('html')
      assert.ok(await equalElements(browser, resultDocument, expectedDocument))
    } finally {
      await browser.switchToFrame(null).catch(() => null)
    }
  }
  async function getCurrentWorld() {
    const actual = await spec.getCurrentWorld(browser)
    const expected = 'NATIVE_APP'
    assert.deepStrictEqual(actual, expected)
  }
  async function getWorlds() {
    const actual = await spec.getWorlds(browser)
    const expected = ['NATIVE_APP', 'WEBVIEW_com.applitools.eyes.android']
    assert.deepStrictEqual(actual, expected)
  }
  async function switchWorld({input}: {input: {name: string}}) {
    await spec.switchWorld(browser, input.name)
    const actual = await browser.getContext()
    const expected = input.name
    assert.deepStrictEqual(actual, expected)
  }
  async function findElement({
    input,
    expected,
  }: {
    input: {selector: Applitools.WebdriverIO.Selector; parent?: Applitools.WebdriverIO.Element}
    expected?: spec.Element | null
  }) {
    const root = input.parent ?? browser
    expected = expected === undefined ? await root.$(input.selector) : expected
    const element = await spec.findElement(browser, input.selector, input.parent)
    if (element && expected) {
      assert.ok(await equalElements(browser, element, expected))
    }
  }
  async function findElements({
    input,
    expected,
  }: {
    input: {selector: Applitools.WebdriverIO.Selector; parent?: Applitools.WebdriverIO.Element}
    expected?: spec.Element[]
  }) {
    const root = input.parent ?? browser
    expected = expected === undefined ? await root.$$(input.selector) : expected
    const elements = await spec.findElements(browser, input.selector, input.parent)
    assert.strictEqual(elements.length, (expected as any).length)
    for (const [index, element] of elements.entries()) {
      assert.ok(await equalElements(browser, element, (expected as any)[index]))
    }
  }
  async function takeScreenshot() {
    const screenshot = await spec.takeScreenshot(browser)
    assert.ok(Buffer.isBuffer(screenshot) || utils.types.isArray)
  }
  async function setElementText({input}: {input: {element: Applitools.WebdriverIO.Element; text: string}}) {
    const element = await browser.$(input.element)
    await element.setValue('bla bla')
    await spec.setElementText(browser, input.element, input.text)
    const text = await element.getValue()
    assert.strictEqual(text, input.text)
  }
  async function getWindowSize({legacy = false} = {}) {
    let size
    if (legacy) {
      size = await browser.getWindowSize()
    } else {
      const {width, height} = await browser.getWindowSize()
      size = {width, height}
    }
    const result = await spec.getWindowSize(browser)
    assert.deepStrictEqual(result, size)
  }
  async function setWindowSize({legacy = false, input}: {legacy?: boolean; input: Size}) {
    await spec.setWindowSize(browser, input)
    let rect
    if (legacy) {
      const {x, y} = await browser.getWindowPosition()
      const {width, height} = await browser.getWindowSize()
      rect = {x, y, width, height}
    } else {
      rect = await browser.getWindowRect()
    }
    assert.deepStrictEqual(rect, {x: 0, y: 0, ...input})
  }
  async function getCookies({input}: {input?: {context: boolean}} = {}) {
    const cookie: Cookie = {
      name: 'hello',
      value: 'world',
      domain: input?.context ? '.applitools.github.io' : 'google.com',
      path: '/',
      expiry: Math.floor((Date.now() + 60000) / 1000),
      sameSite: 'Lax',
      httpOnly: true,
      secure: true,
    }
    if (input?.context) {
      await browser.addCookie(cookie)
    } else {
      const request = {...cookie, expires: cookie.expiry}
      if (browser.isDevTools) {
        const puppeteer = await browser.getPuppeteer()
        const [page] = await puppeteer.pages()
        const cdpSession = await page.target().createCDPSession()
        await cdpSession.send('Network.setCookie', request)
      } else {
        await browser.sendCommandAndGetResult('Network.setCookie', request)
      }
    }
    const result = await spec.getCookies(browser, input?.context)
    assert.deepStrictEqual(result, [cookie])
  }
  async function getOrientation({expected}: {expected: string}) {
    const result = await spec.getOrientation(browser)
    assert.strictEqual(result, expected)
  }
  async function getTitle() {
    const expected = await browser.getTitle()
    const result = await spec.getTitle(browser)
    assert.deepStrictEqual(result, expected)
  }
  async function getUrl() {
    const result = await spec.getUrl(browser)
    assert.deepStrictEqual(result, url)
  }
  async function visit() {
    const blank = 'about:blank'
    await spec.visit(browser, blank)
    const actual = await browser.getUrl()
    assert.deepStrictEqual(actual, blank)
    await browser.url(url)
  }
  function extractHostName({expected}: {expected: string}) {
    const driverUrl = spec.extractHostName(browser)
    assert.strictEqual(driverUrl, expected)
  }
})

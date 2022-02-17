'use strict'

const {describe, before, after, beforeEach} = require('mocha')
const puppeteer = require('puppeteer')
const makeRenderingGridClient = require('../../src/sdk/renderingGridClient')
const {testServerInProcess} = require('@applitools/test-server')
const {deserializeDomSnapshotResult} = require('@applitools/eyes-sdk-core/shared')
const {getProcessPageAndSerialize} = require('@applitools/dom-snapshot')
const fs = require('fs')
const {resolve} = require('path')
const testLogger = require('../util/testLogger')

describe('eyesCheckWindowWithPageCover', () => {
  let baseUrl, closeServer, openEyes
  const apiKey = process.env.APPLITOOLS_API_KEY // TODO bad for tests. what to do
  let browser, page
  let processPage

  beforeEach(() => {
    openEyes = makeRenderingGridClient({
      showLogs: process.env.APPLITOOLS_SHOW_LOGS,
      apiKey,
      fetchResourceTimeout: 2000,
      logger: testLogger,
    }).openEyes
  })

  before(async () => {
    if (!apiKey) {
      throw new Error('APPLITOOLS_API_KEY env variable is not defined')
    }
    const server = await testServerInProcess({port: 3458}) // TODO fixed port avoids 'need-more-resources' for dom. Is this desired? should both paths be tested?
    baseUrl = `http://localhost:${server.port}`
    closeServer = server.close

    browser = await puppeteer.launch()
    page = await browser.newPage()

    const processPageAndSerializeScript = await getProcessPageAndSerialize()
    processPage = () =>
      page.evaluate(`(${processPageAndSerializeScript})()`).then(deserializeDomSnapshotResult)
  })

  after(async () => {
    await closeServer()
    await browser.close()
  })

  before(async () => {
    if (process.env.APPLITOOLS_UPDATE_FIXTURES) {
      await page.goto(`${baseUrl}/test.html`)
      const {cdt} = await processPage()

      for (const el of cdt) {
        const attr = el.attributes && el.attributes.find(x => x.name === 'data-blob')
        if (attr) {
          if (el.nodeName === 'LINK') {
            const hrefAttr = el.attributes.find(x => x.name === 'href')
            hrefAttr.value = attr.value
          }

          if (el.nodeName === 'IMG') {
            const srcAttr = el.attributes.find(x => x.name === 'src')
            srcAttr.value = attr.value
          }
        }
      }

      const cdtStr = JSON.stringify(cdt, null, 2)
      fs.writeFileSync(resolve(__dirname, '../fixtures/test.cdt.json'), cdtStr)
    }
  })
})

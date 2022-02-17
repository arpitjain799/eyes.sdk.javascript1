const VisualGridClient = require('@applitools/visual-grid-client')
const spec = require('@applitools/spec-driver-selenium')
const {expect} = require('chai')
const {makeSDK} = require('../../index')
const {getTestInfo} = require('@applitools/test-utils')

// this is an example
describe('pageCoverage e2e', () => {
  let driver, destroyDriver
  beforeEach(async () => {
    ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
  })

  afterEach(async () => {
    if (destroyDriver) await destroyDriver()
  })

  it.skip('works', async () => {
    const sdk = makeSDK({
      name: 'check e2e',
      version: '1.2.5.',
      spec,
      VisualGridClient,
    })

    const manager = await sdk.makeManager()
    const eyes = await manager.openEyes({
      driver,
      config: {appName: 'check e2e', testName: 'check e2e test', logs: {type: 'console'}},
    })
    await driver.get('https://example.org')
    await eyes.check({config: {cut: {top: 50, bottom: 0, left: 0, right: 0}}})
    await eyes.close({throwErr: true})
  })
  it('pageId and region works', async () => {
    const pageId = 'my-page'
    const region = { width: 200, height: 400, x: 20, y: 77 }
    const sdk = makeSDK({
      name: 'pageId works',
      version: '1.2.5.',
      spec,
      VisualGridClient,
    })

    const manager = await sdk.makeManager()
    const eyes = await manager.openEyes({
      driver,
      config: {
        appName: 'pageId in check',
        testName: 'pageId',
        matchTimeout: 0,
        logs: {type: 'console'},
        viewportSize: {width: 1000, height: 555},
        browsersInfo: [{name: 'chrome', width: 1000, height: 600}],
      },
    })
    await driver.get('https://demo.applitools.com/app.html')
    await eyes.check({
      settings: {
        fully: true,
        region,
         // 'div.content-w > div > div > div:nth-child(2) > div > div > table > tbody > tr:nth-child(6) > td.cell-with-media',
        pageId
      },
    })
    const [results] = await eyes.close({throwErr: false})
    const testData = await getTestInfo(results, process.env.APPLITOOLS_API_KEY)
    const pageCoverageInfo = testData.actualAppOutput[0].pageCoverageInfo;
    expect(pageCoverageInfo.pageId).to.eq(pageId, 'match pageId')
    expect(pageCoverageInfo.imagePositionInPage).to.deep.include({x: region.x, y: region.y}, 'match region x and y')
  })
})

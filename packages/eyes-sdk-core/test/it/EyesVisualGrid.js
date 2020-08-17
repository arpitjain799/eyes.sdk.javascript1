const {expect} = require('chai')
const {startFakeEyesServer, getSession} = require('@applitools/sdk-fake-eyes-server')
const MockDriver = require('../utils/MockDriver')
const {EyesVisualGrid} = require('../utils/FakeSDK')
const {MatchLevel, ConsoleLogHandler, Logger, ServerConnector} = require('../../index')

describe('EyesVisualGrid', async () => {
  let server, serverUrl, driver, eyes

  before(async () => {
    server = await startFakeEyesServer({
      logger: new Logger(process.env.APPLITOOLS_SHOW_LOGS),
      matchMode: 'always',
    })
    serverUrl = `http://localhost:${server.port}`
  })

  beforeEach(async () => {
    driver = new MockDriver()
    eyes = new EyesVisualGrid()
    if (process.env.APPLITOOLS_SHOW_LOGS) {
      eyes.setLogHandler(new ConsoleLogHandler(true))
    }
    eyes.setServerUrl(serverUrl)
  })

  after(async () => {
    await server.close()
  })

  it('should use default match level', async () => {
    await eyes.open(driver, 'FakeApp', 'FakeTest')
    await eyes.check()
    const results = await eyes.close()
    const {matchLevel} = await extractMatchSettings(results)
    expect(matchLevel).to.be.eql('Strict')
  })

  it('should use specified match level', async () => {
    await eyes.open(driver, 'FakeApp', 'FakeTest')
    await eyes.check({matchLevel: MatchLevel.Layout})
    const results = await eyes.close()
    const {matchLevel} = await extractMatchSettings(results)
    expect(matchLevel).to.be.eql('Layout')
  })

  it('should not create session with missing device size', async () => {
    const origStartSession = ServerConnector.prototype.startSession
    let startSessionCalled
    ServerConnector.prototype.startSession = async () => {
      startSessionCalled = true
    }
    const conf = eyes.getConfiguration()
    conf.addBrowser({deviceName: 'non-existent'})
    eyes.setConfiguration(conf)
    await eyes.open(driver, 'FakeApp', 'FakeTest')
    await eyes.check({matchLevel: MatchLevel.Layout})
    const err = await eyes.close().catch(err => err)
    ServerConnector.prototype.startSession = origStartSession
    expect(startSessionCalled).to.be.undefined
    expect(err.message).to.contain('failed to render screenshot')
  })

  async function extractMatchSettings(results) {
    const session = await getSession(results, serverUrl)
    const imageMatchSettings = session.steps[0].matchWindowData.options.imageMatchSettings
    return imageMatchSettings
  }
})

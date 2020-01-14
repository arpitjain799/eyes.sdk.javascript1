const createTestCafe = require('testcafe')
const stream = require('stream')
const fs = require('fs')
const {
  makeCoverageTests,
  convertExecutionModeToSuffix,
} = require('@applitools/sdk-test-kit').coverageTests

const supportedTests = [
  // viewport
  {name: 'TestCheckWindow_Fluent', executionMode: {isCssStitching: true}},
  {name: 'TestCheckWindow_Fluent', executionMode: {isScrollStitching: true}},
  // full page
  {name: 'TestCheckPageWithHeaderFully_Window', executionMode: {isCssStitching: true}},
  {name: 'TestCheckPageWithHeaderFully_Window', executionMode: {isScrollStitching: true}},
]

const sdkName = 'eyes-testcafe'
function initialize() {
  let baselineTestName
  let output = {
    setup: [],
  }
  function _out() {
    return output
  }
  function _setup(options) {
    baselineTestName = options.baselineTestName
    output.setup.push(`eyes.setBranchName('${options.branchName}')`)
    options.executionMode.isCssStitching
      ? output.setup.push(`eyes.setStitchMode(StitchMode.CSS)`)
      : undefined
    options.executionMode.isScrollStitching
      ? output.setup.push(`eyes.setStitchMode(StitchMode.SCROLL)`)
      : undefined
    output.setup.push(`eyes.setBatch('JS Coverage Tests - ${sdkName}', '12345')`)
  }
  function abort() {}
  function visit(url) {
    output.visit = url
  }
  function open(options) {
    const viewportSizes = options.viewportSize.split('x')
    output.open = `await eyes.open(driver, '${options.appName}', '${baselineTestName}', {width: ${viewportSizes[0]}, height: ${viewportSizes[1]}})`
  }
  function checkFrame() {}
  function checkRegion() {}
  function checkWindow(options) {
    const isFully = !!(options && options.isFully)
    output.checkWindow = `await eyes.check(undefined, Target.window().fully(${isFully}))`
  }
  function close(_options) {
    output.close = `await eyes.close()`
  }
  function getAllTestResults() {}
  function scrollDown() {}
  function switchToFrame() {}
  function type() {}
  return {
    _out,
    _setup,
    abort,
    checkFrame,
    checkRegion,
    checkWindow,
    close,
    getAllTestResults,
    open,
    scrollDown,
    switchToFrame,
    type,
    visit,
  }
}

function makeTestBody(testName, output) {
  let testCommands = {...output}
  delete testCommands.visit
  delete testCommands.getAllTestResults
  delete testCommands.setup
  return `const {Eyes, StitchMode, Target} = require('../../../index')
const eyes = new Eyes()

fixture\`${testName}\`
  .page('${output.visit}')
  .beforeEach(async () => {
    ${output.setup.join('\n    ')}
  })
  ${output.getAllTestResults ? '.after(async () => ' + output.getAllTestResults + ')' : ''}

test('${testName}', async driver => {
  ${Object.values(testCommands).join('\n  ')}
})`
}

function createTestFiles(testFileDir) {
  supportedTests.forEach(async supportedTest => {
    const commands = initialize()
    const tests = makeCoverageTests(commands)
    const baselineTestName = `${supportedTest.name}${convertExecutionModeToSuffix(
      supportedTest.executionMode,
    )}`
    if (commands._setup) {
      commands._setup({
        baselineTestName,
        branchName: 'master',
        executionMode: supportedTest.executionMode,
      })
    }
    await tests[supportedTest.name]()
    const body = makeTestBody(supportedTest.name, commands._out())
    if (!fs.existsSync(testFileDir)) {
      fs.mkdirSync(testFileDir)
    }
    fs.writeFileSync(`${testFileDir}/${baselineTestName}.js`, body)
  })
}

class MyStream extends stream.Writable {
  _write(chunk, _encoding, next) {
    this.report = JSON.parse(chunk.toString('utf8'))
    next()
  }
}

async function run() {
  process.stdout.write('Preparing test files...')
  const testFileDir = `${__dirname}/tmp`
  createTestFiles(testFileDir)
  process.stdout.write(' Done!\n\n')
  console.log('Running TestCafe tests...')
  const testCafe = await createTestCafe('localhost', 1337, 1338)
  const runner = testCafe.createRunner()
  const stream = new MyStream()
  await runner
    .src(testFileDir)
    .browsers('chrome:headless')
    //.concurrency(5)
    .reporter('json', stream)
    .run()
    .catch(console.error)
  stream.report.fixtures.forEach(fixture => {
    console.log(fixture.tests)
  })
  testCafe.close()
}

run()

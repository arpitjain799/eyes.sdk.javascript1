const {promises: fs} = require('fs')
const {Eyes, BatchInfo, Region} = require('../../dist')

describe('TestEyesImages', function() {
  let batch

  before(() => {
    batch = new BatchInfo('TestEyesImages')
  })

  function setup(testTitle) {
    const eyes = new Eyes()
    eyes.setBatch(batch)

    eyes.getLogger().log(`running test: ${testTitle}`)
    return eyes
  }

  async function teardown(eyes) {
    try {
      const results = await eyes.close()
      eyes.getLogger().log(`Mismatches: ${results.getMismatches()}`)
    } finally {
      await eyes.abort()
    }
  }

  it('TestRegion', async function() {
    const eyes = setup(this.test.title)
    await eyes.open('TestEyesImages', 'TestRegion(Bitmap)')

    const gbg1Data = await fs.readFile(`${__dirname}/../fixtures/gbg1.png`)
    await eyes.checkRegion(gbg1Data, new Region(309, 227, 381, 215), this.test.title)
    await teardown(eyes)
  })
})

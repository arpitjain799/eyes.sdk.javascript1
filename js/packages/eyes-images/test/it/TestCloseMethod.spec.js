const assert = require('assert')
const {Eyes, BatchInfo, DiffsFoundError} = require('../../dist')

describe('TestCloseMethod', function() {
  this.timeout(5 * 60 * 1000)

  it('close', async function() {
    const batch = new BatchInfo()
    const eyes = new Eyes()
    eyes.setBatch(batch)

    await eyes.open(this.test.parent.title, this.test.title, {
      height: 800,
      width: 600,
    })
    await eyes.checkImage(`${__dirname}/../fixtures/gbg1.png`, 'TestBitmap1')
    await eyes.close(false)

    await eyes.open(this.test.parent.title, this.test.title, {
      height: 800,
      width: 600,
    })
    await eyes.checkImage(`${__dirname}/../fixtures/gbg2.png`, 'TestBitmap1')
    await assert.rejects(eyes.close(true), DiffsFoundError)
  })
})

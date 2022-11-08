'use strict'

const assert = require('assert')
const utils = require('@applitools/utils')
const {Eyes} = require('../../dist')

let /** @type {Eyes} */ eyes
describe('EyesImages.TestImageDiffs', function() {
  this.timeout(5 * 60 * 1000)

  before(function() {
    eyes = new Eyes()
    // eyes.setProxy('http://localhost:8888');
  })

  it('ShouldDetectDiffs', async function() {
    const testName = `${this.test.title}_${utils.general.guid()}`
    const image1 = `${__dirname}/../fixtures/image1.png`
    const image2 = `${__dirname}/../fixtures/image2.png`

    await eyes.open(this.test.parent.title, testName)
    await eyes.checkImage(image1)
    await eyes.close(false)

    await eyes.open(this.test.parent.title, testName)
    await eyes.checkImage(image2)
    const results = await eyes.close(false)

    assert.strictEqual(results.getStatus(), 'Unresolved')
  })
})

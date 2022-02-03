'use strict'
const assert = require('assert')
const {resetEnvVars} = require('../../testUtils')
const makeCheck = require('../../../lib/new/check')

function makeSetCut({eyes}) {
  return async function setCut(cut) {
    eyes.setCut(cut)
  }
}
function makeGetCut({eyes}) {
  return async function getCut() {
    return eyes.getCut()
  }
}
class EyesMock {
  constructor() {
    ;(this.appName = 'App'), (this.testName = 'TestImageCut')
    this._configuration = {
      mergeConfig: () => {},
    }
  }
  check() {
    return this
  }
  setCut(cut) {
    this.cut = cut
  }
  getCut() {
    return this.cut
  }
  toJSON() {}
}
function EyesMockWithCutFunc() {
  const eyes = new EyesMock()
  return {
    check: makeCheck({eyes}),
    setCut: makeSetCut({eyes}),
    getCut: makeGetCut({eyes}),
  }
}

describe('New', () => {
  let apiKey
  before(() => {
    apiKey = process.env.APPLITOOLS_API_KEY
  })
  beforeEach(() => {
    resetEnvVars()
  })
  after(() => {
    resetEnvVars()
    process.env.APPLITOOLS_API_KEY = apiKey
  })
  describe('setImageCutAfterOpenEyes', async () => {
    let eyes
    const initialCut = {top: 10, bottom: 0, left: 0, right: 0}
    const updatedCut = {top: 20, bottom: 0, left: 0, right: 0}
    before(async () => {
      eyes = new EyesMockWithCutFunc()
    })

    it('initialSetCut', async () => {
      await eyes.setCut(initialCut)
      await eyes.check()
      const result = await eyes.getCut()
      assert.strictEqual(result, initialCut)
    })
    it('setCutViaCheck', async () => {
      await eyes.check({config: {cut: updatedCut}})
      const result = await eyes.getCut()
      assert.strictEqual(result, updatedCut)
    })
  })
})

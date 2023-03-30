'use strict'
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const path = require('path')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-match-level')
const cypressUtils = require('../util').cypressUtils({targetTestAppPath, sourceTestAppPath})
const {runCypress, updateConfigFile} = cypressUtils

describe('match level', () => {
  before(async () => {
    await cypressUtils.before()
  })

  after(async () => {
    await cypressUtils.after()
  })

  beforeEach(async () => {
    await cypressUtils.beforeEach()
  })

  it('should pass when matchLevel is layout and fail when its not', async () => {
    try {
      await updateConfigFile('index-run.js', 'match-level.js')
      await runCypress()
      expect.fail()
    } catch (ex) {
      debugger
      expect(ex.stdout).to.include('1 failed')
      expect(ex.stdout).to.include('1 pass')
    }
  })
})

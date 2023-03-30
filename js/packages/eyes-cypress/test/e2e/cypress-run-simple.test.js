'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-simple')

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

  it('works for simple.js', async () => {
    try {
      await updateConfigFile('index-run.js', 'simple.js')
      await runCypress()
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})

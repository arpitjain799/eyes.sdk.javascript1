'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-disableBrowserFetching')

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
    await cypressUtils.beforeEach({
      disableBrowserFetching: true,
    })
  })

  it('works for disableBrowserFetching.js', async () => {
    try {
      await updateConfigFile('index-run.js', 'disableBrowserFetching.js')
      await runCypress()
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})

'use strict'
const {expect} = require('chai')
let startPlugin = require('../../../dist/plugin').default

describe('start plugin', () => {
  let getCloseServer, __module

  beforeEach(() => {
    __module = {exports: () => {}}
    getCloseServer = startPlugin(__module)
  })

  afterEach(async () => {
    __module = null
    await getCloseServer()
  })

  it('patches module exports with correct pref', async () => {
    const {eyesIsDisabled, eyesFailCypressOnDiff} = await __module.exports(() => {}, 'test')
    expect(eyesIsDisabled).to.be.false
    expect(eyesFailCypressOnDiff).to.be.true
  })

  describe('with eyes disabled', () => {
    before(() => {
      process.env['APPLITOOLS_IS_DISABLED'] = true
      delete require.cache[require.resolve('../../../dist/plugin')]
      startPlugin = require('../../../dist/plugin').default
    })

    beforeEach(() => {
      __module = {exports: () => {}}
      getCloseServer = startPlugin(__module)
    })

    after(() => {
      delete process.env['APPLITOOLS_IS_DISABLED']
      delete require.cache[require.resolve('../../../dist/plugin')]
    })

    it('patches module exports with disabled eyes pref', async () => {
      const {eyesIsDisabled} = await __module.exports(() => {}, 'test')
      expect(eyesIsDisabled).to.be.true
    })
  })

  describe('with eyes dont fail cypress on diff', () => {
    before(() => {
      process.env['APPLITOOLS_FAIL_CYPRESS_ON_DIFF'] = false
      delete require.cache[require.resolve('../../../dist/plugin')]
      startPlugin = require('../../../dist/plugin').default
    })

    beforeEach(() => {
      __module = {exports: () => {}}
      getCloseServer = startPlugin(__module)
    })

    after(() => {
      delete process.env['APPLITOOLS_FAIL_CYPRESS_ON_DIFF']
      delete require.cache[require.resolve('../../../dist/plugin')]
    })

    it('patches module exports with dont fail on diff pref', async () => {
      const {eyesFailCypressOnDiff} = await __module.exports(() => {}, 'test')
      expect(eyesFailCypressOnDiff).to.be.false
    })
  })
})

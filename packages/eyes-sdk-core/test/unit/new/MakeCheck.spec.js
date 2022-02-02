'use strict'
const assert = require('assert')
const { resetEnvVars, EyesMockWithCutFunc } = require('../../testUtils')

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
        let eyes;
        const initialCut = { top: 10, bottom: 0, left: 0, right: 0 };
        const updatedCut = { top: 20, bottom: 0, left: 0, right: 0 };
        before(async () => {
            eyes = new EyesMockWithCutFunc();
        })

        it('initialSetCut', async () => {
            await eyes.setCut(initialCut);
            await eyes.check()
            const result = await eyes.getCut()
            assert.strictEqual(result, initialCut)
        })
        it('setCutViaCheck', async () => {
            await eyes.check({ config: { cut: updatedCut } })
            const result = await eyes.getCut()
            assert.strictEqual(result, updatedCut)
        })
    })
})
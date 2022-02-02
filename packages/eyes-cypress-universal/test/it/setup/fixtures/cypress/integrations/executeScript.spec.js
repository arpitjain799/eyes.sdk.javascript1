const spec = require('../../../../../../dist/browser/spec-driver')
const {describe, it} = require('mocha');

const getUserAgent = "function(arg){\nvar s=function(){\"use strict\";return function(){return window.navigator.userAgent}}();\nreturn s(arg)\n}";

describe('spec: executeScript',async () => {
    it('executeScript no args', async () => {
        cy.visit('https://www.applitools.com/helloworld')
        const userAgnet = await spec.executeScript({context: 'this is some context'}, getUserAgent, {})
        expect(userAgnet).to.contain('Chrome')
    })
})
const spec = require('../../../../../../dist/browser/spec-driver')
const {describe, it} = require('mocha');

describe('spec: findElement', async () => {
    it('works for findElement', async () => {
        const selector = 'body > div > div.section.button-section > button'
        cy.visit('https://www.applitools.com/helloworld')
        const button = await spec.findElement({selector})
        console.log(button)
        expect(typeof(button)).be.equal('object')
        expect(JSON.stringify(button)).to.contain(selector)
    })

    it('works for findElements', async () => {
        const selector = 'div'
        cy.visit('https://www.applitools.com/helloworld')
        const divs = await spec.findElement({selector})
        expect(divs.length).to.equal(7)
    })
})
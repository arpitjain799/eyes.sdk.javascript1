const spec = require('../../../../../../dist/browser/spec-driver')
const {describe, it} = require('mocha');

describe('spec: executeScript',async () => {
    const getUserAgent = "function(arg){\nvar s=function(){\"use strict\";return function(){return window.navigator.userAgent}}();\nreturn s(arg)\n}";
    let resolve, waitForVisit

    beforeEach(() => {  
        waitForVisit = new Promise(thisResolve => resolve = thisResolve)
        waitForVisit.resolve = resolve
        cy.visit('https://www.applitools.com/helloworld').then(() => {
            waitForVisit.resolve()
          })
    })

    it('executeScript no args', async () => {
        await waitForVisit
        const userAgnet = spec.executeScript(cy.state('window').document, getUserAgent, {})
        expect(userAgnet).to.contain('Chrome')
    })  
})

describe('spec: findElement', () => {
    let resolve, waitForVisit
    beforeEach(() => {  
        waitForVisit = new Promise(thisResolve => resolve = thisResolve)
        waitForVisit.resolve = resolve
        cy.visit('https://www.applitools.com/helloworld').then(() => {
            waitForVisit.resolve()
          })
    })

    it('works for findElement css selector', async () => {
        const selector = 'body > div > div.section.button-section > button'
        await waitForVisit
        const button = spec.findElement(cy.state('window').document, selector, 'css')
        expect(button.outerText).to.equal("Click me!")

    })

    it('works for findElement xpath', async () => {
        const xpath = '/html/body/div/div[3]/button'
        await waitForVisit 
        const button = spec.findElement(cy.state('window').document, xpath, 'xpath')
        expect(button.outerText).to.equal("Click me!")
    })

    it('works for findElements with css selector', async () => {
        const selector = 'div'
        await waitForVisit
        const divs = spec.findElements(cy.state('window').document, selector, 'css')
        expect(divs.length).to.equal(7)
    })

    it('works for findElements with xpath', async () => {
        const xpath = '/html/body/div/div[3]'
        await waitForVisit
        const divs = spec.findElements(cy.state('window').document, xpath, 'xpath')
        expect(divs.length).to.equal(1)
    })
})

describe('spec: get set viewportsize', () => {
    let resolve, waitForVisit
    beforeEach(() => {  
        waitForVisit = new Promise(thisResolve => resolve = thisResolve)
        waitForVisit.resolve = resolve
        cy.visit('https://www.applitools.com/helloworld').then(() => {
            waitForVisit.resolve()
          })
    })
    it('works for get and set viewport size', async () => {
        await waitForVisit
        const originalVS = spec.getViewportSize() 
        spec.setViewportSize({size: {height: originalVS.height + 100, width: originalVS.width +  100}})
        const vsAfterResizing = spec.getViewportSize()
        expect(vsAfterResizing.height).to.be.equal(originalVS.height + 100)
        expect(vsAfterResizing.width).to.be.equal(originalVS.width + 100)
    })
})


describe('spec: getCookies', () => {
    let resolve, waitForVisit

    beforeEach(() => {  
        waitForVisit = new Promise(thisResolve => resolve = thisResolve)
        waitForVisit.resolve = resolve
        cy.visit('https://www.applitools.com/helloworld').then(() => {
            waitForVisit.resolve()
          })
    })

    it('works for getCookies', async () => {
        await waitForVisit
        cy.state('window').document.cookie = "value: test getCookies;";
        const returnedCookies = await spec.getCookies()
        expect(returnedCookies).to.deep.include({"name":"","value":"value: test getCookies","path":"/helloworld","domain":"applitools.com","secure":false,"httpOnly":false})        
    })
})



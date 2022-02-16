const spec = require('../../../../../../dist/browser/spec-driver')
const {describe, it} = require('mocha');

describe('spec: executeScript',async () => {
    const getUserAgent = "function(arg){\nvar s=function(){\"use strict\";return function(){return window.navigator.userAgent}}();\nreturn s(arg)\n}";
    it('executeScript no args', async () => {
        cy.visit('https://www.applitools.com/helloworld').then(() => {
            const userAgnet = spec.executeScript(cy.state('window').document, getUserAgent, {})
            expect(userAgnet).to.contain('Chrome')
        })
    })
})

describe('spec: findElement', () => {
    it('works for findElement css selector', () => {
        const selector = 'body > div > div.section.button-section > button'
        cy.visit('https://www.applitools.com/helloworld').then(() => {        
            const button = spec.findElement(cy.state('window').document, selector)
            expect(button.outerText).to.equal("Click me!")
        })
    })

    it('works for findElement xpath', () => {
        const xpath = '/html/body/div/div[3]/button'
        cy.visit('https://www.applitools.com/helloworld').then(() => {        
            const button = spec.findElement(cy.state('window').document, xpath, 'xpath')
            expect(button.outerText).to.equal("Click me!")
        })
    })

    it('works for findElements with css selector', () => {
        const selector = 'div'
        cy.visit('https://www.applitools.com/helloworld').then(() => {
            const divs = spec.findElements(cy.state('window').document, selector)
            expect(divs.length).to.equal(7)
        })
    })

    it('works for findElements with xpath', () => {
        const xpath = '/html/body/div/div[3]'
        cy.visit('https://www.applitools.com/helloworld').then(() => {
            const divs = spec.findElements(cy.state('window').document, xpath, 'xpath')
            expect(divs.length).to.equal(1)
        })
    })
})

describe('spec: get set viewportsize', () => {
    it('works for get and set viewport size', () => {
        cy.visit('https://www.applitools.com/helloworld')
        const originalVS = spec.getViewportSize() 
        spec.setViewportSize({size: {height: originalVS.height + 100, width: originalVS.width +  100}})
        const vsAfterResizing = spec.getViewportSize()
        expect(vsAfterResizing.height).to.be.equal(originalVS.height + 100)
        expect(vsAfterResizing.width).to.be.equal(originalVS.width + 100)
    })
})


describe('spec: getCookies', () => {
    it.only('works for getCookies', () => {
        const cookie = {
            name: 'hello',
            value: 'world',
            domain: 'google.com',
            path: '/',
            expiry: 4025208067,
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
          }
        cy.visit('https://www.applitools.com/helloworld').then(async () => {
            cy.state('window').document.cookie = "username=John Doe; expires=Thu, 18 Dec 2013 12:00:00 UTC; domain: test.com";
            const returnedCookies = await spec.getCookies()
            console.log(returnedCookies)
            console.log(returnedCookies.filter(c => {c.domain === 'test.com'}))
        })
    })
})



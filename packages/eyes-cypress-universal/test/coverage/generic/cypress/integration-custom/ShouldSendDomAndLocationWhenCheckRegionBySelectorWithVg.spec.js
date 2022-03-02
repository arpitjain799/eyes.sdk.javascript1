describe('Coverage tests', () => {
    it('should send dom and location when check region by selector with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({
            appName: 'Applitools Eyes SDK',
            testName: 'ShouldSendDomAndLocationWhenCheckRegionBySelectorWithVg',
            viewportSize:{width: 700, height: 460}
        })

        // cy.get('#centered').then((el) => {
        //     cy.window().then(win => {
        //         const func = new win.Function(`arguments[0].setAttribute("data-expected-target", "true");`)
        //         return func(...[el])
        //       })
        // })

        cy.eyesCheckWindow({
            target: 'region', 
            selector: {selector: '#centered'},
            fully: false
            
        })
        cy.eyesClose()
    })
})
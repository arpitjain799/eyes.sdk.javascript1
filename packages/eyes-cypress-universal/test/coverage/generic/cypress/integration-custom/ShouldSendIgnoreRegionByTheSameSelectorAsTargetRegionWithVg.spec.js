describe('Coverage tests', () => {
    it('should send ignore region by the same selector as target region with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({
            appName: 'Eyes Selenium SDK - Fluent API',
            testName: 'TestCheckElementWithIgnoreRegionBySameElement_Fluent_VG',
            viewportSize:{width: 700, height: 460}
        })
        cy.eyesCheckWindow({
            target: 'region',
            selector: {
                selector: '#overflowing-div-image'
            },
            ignore: ['#overflowing-div-image']
        })
        cy.eyesClose()
    })
})
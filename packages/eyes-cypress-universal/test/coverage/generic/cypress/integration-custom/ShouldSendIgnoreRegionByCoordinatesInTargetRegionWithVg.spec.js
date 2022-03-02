describe('Coverage tests', () => {
    it('should send ignore region by coordinates in target region with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({appName: 'Eyes Selenium SDK - Fluent API', 
        testName: 'TestCheckRegionWithIgnoreRegion_Fluent_VG', 
        viewportSize:{width: 700, height: 460}})
        cy.eyesCheckWindow({
            target: 'region',
            selector: {
                selector: '#overflowing-div',
            },
            ignore: [{x: 50, y: 50, width: 100, height: 100}]
        })
        cy.eyesClose()
    })
})
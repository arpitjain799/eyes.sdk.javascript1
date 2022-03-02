describe('Coverage tests', () => {
    it('should send ignore regions by coordinates with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({ appName: 'Eyes Selenium SDK - Fluent API',
        testName: 'TestCheckFullWindowWithMultipleIgnoreRegionsBySelector_Fluent_VG',
        viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({
            ignore: [{selector: '.ignore'}],
        })
        cy.eyesClose()
    })
})
describe('Coverage tests', () => {
    it('should send accessibility regions by selector with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({
            appName: 'Eyes Selenium SDK - Fluent API',
            testName: 'TestAccessibilityRegions_VG',
            viewportSize:{width: 700, height: 460}
        })
        cy.eyesCheckWindow({
            accessibility: [{accessibilityType: 'LargeText', selector: '.ignore' }]
        })
        cy.eyesClose()
    })
})
describe('Coverage tests', () => {
    it('should send ignore region by selector with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({ appName: 'Eyes Selenium SDK - Fluent API',
        testName: 'TestCheckWindowWithIgnoreBySelector_Fluent_VG',
        viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({
            ignore: [{selector: '#overflowing-div'}]
        })
        cy.eyesClose()
    })
})
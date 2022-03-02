describe('Coverage tests', () => {
    it('should send floating region by selector with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({
            appName: 'Eyes Selenium SDK - Fluent API',
            testName: 'TestCheckWindowWithFloatingBySelector_Fluent_VG',
            viewportSize:{width: 700, height: 460}
        })
        cy.eyesCheckWindow({
           floating: [{selector: '#overflowing-div',
            maxDownOffset: 3,
            maxLeftOffset: 20,
            maxRightOffset: 30}]
        })
        cy.eyesClose()
    })
})
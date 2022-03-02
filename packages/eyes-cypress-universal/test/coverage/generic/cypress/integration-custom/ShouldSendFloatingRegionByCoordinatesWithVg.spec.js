describe('Coverage tests', () => {
    it('should send floating region by coordinates with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({
            appName: 'Eyes Selenium SDK - Fluent API',
            testName: 'TestCheckWindowWithFloatingByRegion_Fluent_VG',
            viewportSize:{width: 700, height: 460}
        })
        cy.eyesCheckWindow({
           floating: [{top: 10, left: 10, width: 20, height: 20,maxUpOffset: 3,
            maxDownOffset: 3,
            maxLeftOffset: 20,
            maxRightOffset: 30}]
        })
        cy.eyesClose()
    })
})
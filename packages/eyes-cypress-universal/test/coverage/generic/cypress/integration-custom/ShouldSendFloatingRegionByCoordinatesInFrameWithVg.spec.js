describe('Coverage tests', () => {
    it('should send floating region by coordinates in frame with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({
            appName: 'Eyes Selenium SDK - Fluent API',
            testName: 'TestCheckRegionInFrame3_Fluent_VG',
            viewportSize:{width: 700, height: 460}
        })
        cy.eyesCheckWindow({
           frames: ['[name="frame1"]'],
           floating: [{top: 200, left: 200, width: 150, height: 150,
            maxDownOffset: 3,
            maxLeftOffset: 20,
            maxRightOffset: 30}],
            matchLevel: 'Layout',
            fully: true,
        })
        cy.eyesClose()
    })
})
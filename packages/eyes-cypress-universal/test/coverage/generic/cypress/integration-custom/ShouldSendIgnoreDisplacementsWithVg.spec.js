describe('Coverage tests', () => {
    it('should send ignore displacements with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({
            appName: 'Eyes Selenium SDK - Fluent API',
            testName: 'TestIgnoreDisplacements_VG',
            viewportSize:{width: 700, height: 460}
        })
        cy.eyesCheckWindow({
            ignoreDisplacements: true,
            fully: true
            
        })
        cy.eyesClose()
    })
})
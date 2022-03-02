
describe('Coverage tests', () => {
    it('should send ignore region by coordinates with vg', () => {
        cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
        cy.eyesOpen({ appName: 'Eyes Selenium SDK - Fluent API',
        testName: 'TestCheckWindowWithIgnoreRegion_Fluent_VG',
        viewportSize: {width: 700, height: 460}})
        cy.get('body > input[type=text]').type('My Input')
        cy.eyesCheckWindow({
            ignore: [{x: 50, y: 50, width: 100, height: 100}],
            fully: true
        })
        cy.eyesClose()
    })
})
/* global cy expect*/
describe('works with visualGridOptions from config file', () => {
  it('test visualGridOptions from config file', () => {
    cy.visit('https://applitools.github.io/demo/TestPages/ufg-options.html')
    cy.eyesOpen({
      appName: 'Applitools Eyes SDK',
      testName: 'ShouldSendUfgOptions',
      displayName: 'should send ufg options',
      viewportSize: {width: 700, height: 460},
      browser: [{width: 640, height: 480}],
    })
    cy.eyesCheckWindow()
    cy.eyesClose()
    cy.eyesGetAllTestResults().then(summary => {
      expect(summary.getAllResults()[0].getException()).to.be.undefined
    })
  })
})

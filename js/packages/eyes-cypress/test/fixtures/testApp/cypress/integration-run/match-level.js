/* global cy, Cypress */
describe('match-lever', () => {
  it('should work when match level is layout', () => {
    cy.setCookie('auth', 'secret')
    const url = `http://localhost:${Cypress.config('testPort')}/match-level.html`
    cy.visit(url)
    cy.eyesOpen({
      appName: 'some app',
      browser: {width: 1024, height: 768},
      matchLevel: 'Layout',
    })
    cy.eyesCheckWindow('full page')
    cy.eyesClose()
  })
  it('should **not** work when match level is **not** layout', () => {
    cy.setCookie('auth', 'secret')
    const url = `http://localhost:${Cypress.config('testPort')}/match-level.html`
    cy.visit(url)
    cy.eyesOpen({
      appName: 'some app',
      browser: {width: 1024, height: 768},
    })
    cy.eyesCheckWindow('full page')
    cy.eyesClose()
  })
})

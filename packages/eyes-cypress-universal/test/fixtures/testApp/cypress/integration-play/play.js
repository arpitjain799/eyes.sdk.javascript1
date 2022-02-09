/* global describe, it, cy, Cypress */
Cypress.on('uncaught:exception', () => {});

describe('Play Cypress', () => {
  it('Play Cypress', () => {
    cy.visit('https://example.org', {
      failOnStatusCode: false,
    });
    cy.eyesOpen({
      appName: 'Play Cypress',
    });
    cy.eyesCheckWindow({
      tag: 'Play Cypress',
    });
    cy.eyesCheckWindow({
      target: 'region',
      selector: {
        type: 'css',
        selector: 'body > div > h1' 
      }
    });
    cy.eyesClose();
  });
});

/* global describe, it, cy, Cypress */
Cypress.on('uncaught:exception', () => {});

describe('Play Cypress', () => {
  it('Play Cypress', () => {
    cy.visit('https://example.org', {
      failOnStatusCode: false,
    });
    cy.eyesOpen({
      appName: 'Play Cypress',
      testName: 'Check Window 2'
    });
    cy.eyesCheckWindow({
      tag: 'Play Cypress',
      layout: [{selector: 'body > div > h1'},   {top: 100, left: 0, width: 1000, height: 100},]
    });
    cy.eyesClose();
    // cy.eyesGetAllTestResults().then((results) => {
    //   console.log(results)
    // })
  });
  it('Play Cypress checkRegion', () => {
    cy.visit('https://example.org', {
      failOnStatusCode: false,
    });
    cy.eyesOpen({
      appName: 'Play Cypress',
      testName: 'Check Region'
    });
    cy.eyesCheckWindow({
      target: 'region',
      selector: {
        type: 'css',
        selector: 'body > div > h1' 
      }
    });
    cy.eyesClose();
    // cy.eyesGetAllTestResults().then((results) => {
    //   console.log(results)
    // })
  });
  it.skip('test region in shadow DOM', () => {
    cy.visit('https://applitools.github.io/demo/TestPages/ShadowDOM/index.html');
    cy.eyesOpen({
      appName: 'som app',
      testName: 'region in shadow dom',
      browser: {width: 800, height: 600},
    });

    cy.eyesCheckWindow({
      target: 'region',
      selector: [{
        type: 'css',
        selector: '#has-shadow-root',
        nodeType: 'shadow-root'
      },{
          type: 'css',
          selector: 'h1',
          nodeType: 'element'
          
      }]
  });
    cy.eyesCheckWindow({
      target: 'region',
      selector: [{
        type: 'css',
        selector: '#has-shadow-root',
        nodeType: 'shadow-root'
      },{
          type: 'css',
          selector: '#has-shadow-root-nested > div',
          nodeType: 'shadow-root'
          
      },{
          type: 'css',
          selector: 'div',
          nodeType: 'element'

      }]
  });
    cy.eyesClose();
  });
  
});

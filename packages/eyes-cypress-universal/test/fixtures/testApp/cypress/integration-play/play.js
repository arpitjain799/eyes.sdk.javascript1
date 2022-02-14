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
    // cy.eyesCheckWindow({
    //   tag: 'Play Cypress',
    //   layout: [{selector: 'body > div > h1'},   {top: 100, left: 0, width: 1000, height: 100},]
    // });
    cy.eyesCheckWindow({
      target: 'region',
      selector: {
        type: 'css',
        selector: 'body > div > h1' 
      }
    });
    cy.eyesClose();
    cy.eyesGetAllTestResults().then((results) => {
      console.log(results)
    })
  });
  it.only('test region in shadow DOM', () => {
    cy.visit('https://applitools.github.io/demo/TestPages/ShadowDOM/index.html');
    cy.eyesOpen({
      appName: 'some app',
      testName: 'region in shadow dom',
      browser: {width: 800, height: 600},
    });

    // cy.eyesCheckWindow({
    //   target: 'region',
    //   selector: {
    //     type: 'css',
    //     selector: '#has-shadow-root'
    //   }
    // });
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
    cy.eyesClose();
  });
});

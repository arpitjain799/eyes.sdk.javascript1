/* global describe, it, cy, Cypress */
Cypress.on('uncaught:exception', () => {});

describe('Play Cypress', () => {
  beforeEach(() => {
    cy.setCookie('auth', 'secret');
    cy.eyesOpen({
      appName: 'some app2',
      browser: {width: 1024, height: 768},
      // showLogs: true,
    });
  });
  it.only('region absolute', () => {
    cy.visit('http://localhost:8080/test.html');
    cy.get('.absolutely').then($el => {
      const {left, top, width, height} = $el[0].getBoundingClientRect();
      cy.eyesCheckWindow({
        tag: 'region',
        target: 'region',
        region: {left, top, width, height},
      });
    });
  });

  afterEach(() => {
    cy.eyesClose();
  });

  it('Play Cypress', () => {
    
    cy.eyesOpen({
      appName: 'Play Cypress',
      testName: 'Check Window',
     // browser: [{width: 1200, height: 900}]
    });
    cy.visit('https://example.org', {
      failOnStatusCode: false,
    });
    cy.eyesCheckWindow({
      tag: 'Play Cypress',
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

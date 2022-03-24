/* global cy */
describe('Use batchId from env var', () => {
  // This also tests the override of `testName`

  it('shows how to use Applitools Eyes with Cypress', () => {
    cy.visit('https://applitools.com/helloworld');
    cy.eyesOpen({
      appName: 'Hello World!',
      testName: 'work with batchId eyesOpen',
      browser: {width: 800, height: 600},
      batchId: 'BatchId-EyesOpen1',
    });
    cy.eyesCheckWindow('Main Page');
    cy.eyesClose();
  });

  it('shows how to use Applitools Eyes with Cypress', () => {
    cy.visit('https://applitools.com/helloworld');
    cy.eyesOpen({
      appName: 'Hello World!',
      testName: 'work with batchId eyesOpen',
      browser: {width: 800, height: 600},
      batch: {id: 'BatchId-EyesOpen2'},
    });
    cy.eyesCheckWindow('Main Page');
    cy.eyesClose();
  });
});

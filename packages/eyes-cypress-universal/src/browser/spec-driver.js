// marking the root context as Cypress works differently from other frameworks

//and the page that is tested is actually nested within a frame

function setRootContext() {
  // window.parent[0].document['applitools-marker'] = 'root-context'
  window.document['applitools-marker'] = 'root-context';
}

function executeScript(context, script, arg = {}) {
    let scriptToExecute
    let args = arg
    if (
    script.includes('dom-snapshot') ||
    script.includes('dom-capture') ||
    script.includes('dom-shared')
  ) {
        scriptToExecute = script
        args = Object.assign({doc: window.parent[0].document}, arg)
  } else {
        scriptToExecute = script.slice(15).slice(0, -2);
  }

  const executor = new Function('arg', scriptToExecute);
  return executor(args);
}

function isDriver(driver) {
  return driver.hasOwnProperty('browser');
}

function extractContext() {
  return window.parent[0].document;
}

function parentContext(currentContext) {
  return window.parent[0].document;
}

function mainContext(driver) {
  return window.parent[0].document;
}

function transformSelector() {}

function isElement(element) {
  return typeof element === 'object ' && element.hasOwnProperty('specWindow');
}

function isSelector(selector) {
  return selector.hasOwnProperty('selector') || typeof selector === 'string';
}

function getViewportSize(driver) {
  const viewportSize = {
    width: Cypress.config('viewportWidth'),
    height: Cypress.config('viewportHeight'),
  };
  return viewportSize;
}

function setViewportSize(vs) {
  cy.viewport(vs.size.width, vs.size.height);
}

function findElement(element) {
  if (typeof element === 'string') return cy.get(element.selector);
  else return element;
}

module.exports = {
  mainContext,
  executeScript,
  isDriver,
  isElement,
  isSelector,
  parentContext,
  getViewportSize,
  setViewportSize,
  findElement,
  setRootContext,
  extractContext,
};

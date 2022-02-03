export type Selector = {selector: string};
export type Driver = Cypress.Browser;
export type Context = Document;
export type Element = JQuery | HTMLElement;

export function executeScript(context: Context, script: string, arg = {}) {
  // if(!Cypress.dom.isDocument(context)) return

  return new Promise(resolve => {
    cy.document().then(doc => {
      let scriptToExecute;
      let args = arg;
      if (
        script.includes('dom-snapshot') ||
        script.includes('dom-capture') ||
        script.includes('dom-shared')
        ) {
          scriptToExecute = script;
          args = Object.assign({doc}, arg);
        } else {
          scriptToExecute = script.slice(15).slice(0, -2);
        }
        
        const executor = new Function('arg', scriptToExecute);
        //return executor(args);
        resolve(executor(args));
    });
  });
}

export function executeScript2(context: Driver, script: string, arg = {}) {
  // if(!Cypress.dom.isDocument(context)) return

      let scriptToExecute;
      let args = arg;
      if (
        script.includes('dom-snapshot') ||
        script.includes('dom-capture') ||
        script.includes('dom-shared')
      ) {
        scriptToExecute = script;
        args = Object.assign({doc: window.parent[0].document}, arg);
      } else {
        scriptToExecute = script.slice(15).slice(0, -2);
      }

      const executor = new Function('arg', scriptToExecute);
      return executor(args);
}

export function isDriver(driver: Driver) {
  return driver.hasOwnProperty('browser');
}

export function extractContext() {
  return window.parent[0].document;
}

export function parentContext(currentContext: Context) {
  return window.parent[0].document;
}

export function mainContext(driver: Driver) {
  return window.parent[0].document;
}

export function transformSelector() {}

export function isElement(element: Element) {
  // return typeof element === 'object ' && element.hasOwnProperty('specWindow');
  return Cypress.dom.isElement(element);
}

export function isSelector(selector: Selector) {
  return selector.hasOwnProperty('selector');
}

export function getViewportSize(driver: Driver) {
  const viewportSize = {
    width: Cypress.config('viewportWidth'),
    height: Cypress.config('viewportHeight'),
  };
  return viewportSize;
}

export function setViewportSize(vs: any) {
  cy.viewport(vs.size.width, vs.size.height);
}

export function findElement(element: Selector) {
  // need to check if the element is selector or HTMLElement

  return new Promise(resolve => { 
    cy.get(element.selector).then((el) => {
      resolve(el);
    })
  })
}

export function findElements(element: Selector){
  return new Promise(resolve => {
    cy.get(element.selector).then((elements) => resolve(elements));
  })
}

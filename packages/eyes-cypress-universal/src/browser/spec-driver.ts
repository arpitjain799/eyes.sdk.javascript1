// need to check for more possible structures of selector
export type Selector = { selector: {selector: string } } ;
export type Context = Document;
export type Element = JQuery | HTMLElement;

//@ts-ignore
let document: Context

export function executeScript(context: Context, script: string, arg: any) {
      //@ts-ignore
      document = document ? document : cy.state('window').document 
      if (
        script.includes('dom-snapshot') ||
        script.includes('dom-capture') ||
        script.includes('dom-shared')
        ) {
            const scriptToExecute = script;
            const args = Object.assign({doc: document}, arg);
            const executor = new Function('arg', scriptToExecute);
            return executor(args)
        } else {
            const evalScript = prepareSnippet(script, arg)
            const res = document.defaultView.eval(evalScript)
            return res

        }
        
}

export function isDriver(driver: Context): boolean {
  return typeof(driver) === typeof(Document)
}

export function parentContext(currentContext: Context) {
  return currentContext === document ? currentContext : document.defaultView.top.document
}

export function mainContext(): Context {
  return document
}

export function isElement(element: Element): boolean {
  return Cypress.dom.isElement(element);
}

export function isSelector(selector: Selector): boolean {
  return selector.hasOwnProperty('selector');
}

export function getViewportSize(): Object {
  const viewportSize = {
    width: Cypress.config('viewportWidth'),
    height: Cypress.config('viewportHeight'),
  };
  return viewportSize;
}

export function setViewportSize(vs: any) {
  //@ts-ignore
  Cypress.action('cy:viewport:changed', { viewportWidth: vs.size.width, viewportHeight: vs.size.height });
}

export function findElement(element: Selector) {
  if(isSelector(element)){
    return transformSelector(element)
  }
}

export function findElements(element: Selector){
  return [findElement(element)]
}

// utils

function transformSelector(selector: Selector) {
  if(selector.hasOwnProperty('selector')) {
    if(selector.selector.hasOwnProperty('selector') && typeof(selector.selector.selector) === 'string')
      return selector.selector.selector
    else if (typeof(selector.selector) == 'string')
      return selector.selector
  }
}

function prepareSnippet(script: string, arg: any){
  // remove new lines from script
  let prepScirpt = script.replace(/(\r\n|\n|\r)/gm, "");
  prepScirpt = prepScirpt.replace('function(arg)', 'function func(arg)')
  prepScirpt = prepScirpt.concat(' return func(arg)')
  prepScirpt = prepScirpt.replace(/'/g, "\\'")
  const evalScript = `let snippet = '${prepScirpt}'
  let func = new Function('arg', snippet)
  func(${JSON.stringify(arg)})
  `
  return evalScript
}




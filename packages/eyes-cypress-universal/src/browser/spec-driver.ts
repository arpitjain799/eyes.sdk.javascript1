// need to check for more possible structures of selector
// commonSelector (look at playwrigh)
import type {Cookie} from '@applitools/types'

export type Selector = string;
export type Context = Document;
export type Element = HTMLElement;

export function executeScript(context: Context, script: string, arg: any): any {     
      context = getCurrenctContext(context)

      let scriptToExecute;
      if (
        script.includes('dom-snapshot') ||
        script.includes('dom-capture') ||
        script.includes('dom-shared')
        ) {
            scriptToExecute = script
        } else {
            const prepScirpt = script.replace('function(arg)', 'function func(arg)')
            scriptToExecute = prepScirpt.concat(' return func(arg)')
        }

        const executor = new context.defaultView.Function('arg', scriptToExecute);
        return executor(arg)
}

export function isDriver(driver: Context): boolean {
  return typeof(driver) === typeof(Document)
}

export function parentContext(currentContext: Context): Context {
  currentContext = getCurrenctContext(currentContext)
  //@ts-ignore
  return currentContext === cy.state('window').document ? currentContext : document.defaultView.top.document
}

export function mainContext(): Context {
  //@ts-ignore
  return cy.state('window').document
}

export function isElement(element: Element): boolean {
  //@ts-ignore
  return Cypress.dom.isElement(element);
}

export function getViewportSize(): Object {
  //@ts-ignore
  const currWindow = cy.state('window')
  const viewportSize = {
    width: Math.max(currWindow.document.documentElement.clientWidth || 0, currWindow.innerWidth || 0),
    height: Math.max(currWindow.document.documentElement.clientHeight || 0, currWindow.innerHeight || 0)
  };
  return viewportSize;
}

export function setViewportSize(vs: any): void {
  //@ts-ignore
  Cypress.action('cy:viewport:changed', { viewportWidth: vs.size.width, viewportHeight: vs.size.height });
}

export function findElement(context: Context, element: Selector, type: string, parent: Context) {
  context = getCurrenctContext(context)
  if(isSelector(element)) {
    if(parent){
      return parent.querySelector(element)
    } 
    if(type === 'css')
      return context.querySelector(element)
    else {
      return context.evaluate(element, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
  }
}

export function findElements(context: Context, element: Selector, type: string, parent: Context){
  context = getCurrenctContext(context)
  if(isSelector(element)) {
    let elements
    if(parent) {
      elements = parent.querySelectorAll(element)
    } else {
      if(type === 'css') {
        elements = context.querySelectorAll(element)
      }
      else {
        elements = context.evaluate(element, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        return [elements]
      }
    }
    return Object.values(elements)
  }
}

export function isSelector(selector: Selector): boolean {
  return typeof(selector) === 'string';
}

export function getTitle(context: Context): string {
  context = getCurrenctContext(context)
  return context.title
}

export function getUrl(context: Context): string {
  context = getCurrenctContext(context)
  return context.location.href
}

export function childContext(_context: Context, element: HTMLIFrameElement): Context {
  return element.contentDocument
}

export function getCookies(): Array<Cookie> {
  //@ts-ignore
  return Cypress.automation('get:cookies', {})
}

// we need to method to reset the context in case the user called open before visit
function getCurrenctContext(context: Context){
  if(!context.defaultView) {
    //@ts-ignore
    const currContext = cy.state('window').document
    //@ts-ignore
    currContext['applitools-marker'] = 'root-context';
    return currContext
  } else return context
}

// export function takeScreenshot(page: Driver): Promise<Buffer>;

// export function visit(page: Driver, url: string): Promise<void>; (??)

// export function isStaleElementError(err: any): boolean;
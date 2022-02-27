export type Selector = (string | {selector: string; type?: string} | {selector: {selector: string; type?: string}}) & {__applitoolsBrand?: never};
export type Context = Document & {__applitoolsBrand?: never};
export type Element = HTMLElement & {__applitoolsBrand?: never};

export function executeScript(context: Context, script: string, arg: any): any {     
  // context = getCurrenctContext(context)

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

export function mainContext(): Context {
  //@ts-ignore
  return cy.state('window').document
}

export function parentContext(context: Context): Context {
  if (!context) return; // because Cypress doesn't support cross origin iframe, then childContext might return null, and then the input to parentContext might be null
  
  return context === mainContext() ? context : context.defaultView.frameElement.ownerDocument
}

export function childContext(_context: Context, element: HTMLIFrameElement): Context {
  return element.contentDocument // null in case of cross origin iframe
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

export function findElement(context: Context, selector: Selector, parent?: Element) {
  // context = getCurrenctContext(context)
  const root = parent ?? context
  if (typeof selector === 'string' || selector.type === undefined || selector.selector.type === 'css') {
    return root.querySelector(transformSelector(selector))
  } else {
    return context.evaluate(transformSelector(selector), context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;  
  }
}

export function findElements(context: Context, selector: Selector, parent: Element){
  // context = getCurrenctContext(context)
  const root = parent ?? context
  if (typeof selector === 'string' || selector.type === undefined || selector.selector.type === 'css' ) {
    return root.querySelectorAll(transformSelector(selector))
  } else {
    // TODO return multiple
    return context.evaluate(transformSelector(selector), context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;  
  }
}

export function getTitle(context: Context): string {
  // context = getCurrenctContext(context)
  return context.title
}

export function getUrl(context: Context): string {
  // context = getCurrenctContext(context)
  return context.location.href
}

export function getCookies(): Array<any> {
  //@ts-ignore
  return Cypress.automation('get:cookies', {})
}

// we need to method to reset the context in case the user called open before visit
function getCurrenctContext(context: Context){
  //@ts-ignore
  return (context && context.defaultView) ? context : cy.state('window').document
}

function transformSelector(selector: Selector) {
  if (isSelector(selector)) {
    if (isSelector(selector.selector) && typeof selector.selector.selector === 'string')
      return selector.selector.selector;
    else if (typeof selector.selector == 'string') return selector.selector;
  }
}

function isSelector(selector: Selector) {
  return selector.hasOwnProperty('selector');
}


// export function takeScreenshot(page: Driver): Promise<Buffer>;

// export function visit(page: Driver, url: string): Promise<void>; (??)

// export function isStaleElementError(err: any): boolean;
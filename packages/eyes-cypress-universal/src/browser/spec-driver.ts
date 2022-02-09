// need to check for more possible structures of selector
// commonSelector (look at playwrigh)
export type Selector = string;
export type Context = Document;
export type Element = HTMLElement;

export function executeScript(context: Context, script: string, arg: any): any {
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
  //@ts-ignore
  return currentContext === cy.state('window').document ? currentContext : document.defaultView.top.document
}

export function mainContext(): Context {
  return document
}

export function isElement(element: Element): boolean {
  return Cypress.dom.isElement(element);
}

export function getViewportSize(): Object {
  const viewportSize = {
    width: Cypress.config('viewportWidth'),
    height: Cypress.config('viewportHeight'),
  };
  return viewportSize;
}

export function setViewportSize(vs: any): void{
  //@ts-ignore
  Cypress.action('cy:viewport:changed', { viewportWidth: vs.size.width, viewportHeight: vs.size.height });
}

export function findElement(context: Context, element: Selector) {
  if(isSelector(element)) {
    return context.querySelector(element)
  }
}

export function findElements(context: Context, element: Selector){
  if(isSelector(element)) {
    const elements = context.querySelectorAll(element)
    return Object.values(elements)
  }
}

export function isSelector(selector: Selector): boolean {
  return typeof(selector) === 'string';
}

export function getTitle(context: Context): string{
  return context.title
}

export function getUrl(context: Context): string{
  return context.location.href
}

export function childContext(_context: Context, element: HTMLIFrameElement): Context{
  return element.contentDocument
}

export function getCookies(context: Context){
  return context.cookie
}

// export function takeScreenshot(page: Driver): Promise<Buffer>;

// export function visit(page: Driver, url: string): Promise<void>; (??)
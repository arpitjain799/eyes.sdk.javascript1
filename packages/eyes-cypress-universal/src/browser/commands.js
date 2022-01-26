/* global Cypress,cy,window,before,after,navigator */
'use strict';
const makeHandleCypressViewport = require('./makeHandleCypressViewport');
const handleCypressViewport = makeHandleCypressViewport({cy});
const makeSend = require('./makeSend');
const send = makeSend(Cypress.config('localServerPort'), window.fetch);
const makeSendRequest = require('./sendRequest');
const sendRequest = makeSendRequest(send);
const spec = require('./spec-driver');
const Refer = require('./refer');
const Socket = require('./socket');
const {socketCommands} = require('./socketCommands');

const refer = new Refer();
const socket = new Socket();
const throwErr = Cypress.config('failCypressOnDiff');
let connectedToUniversal = false;
socketCommands(socket, refer);

/*

DOTO:
1) need to add another api for getAllTestResults. if a user call it , 
then call the browser after hook with closeAllEyes
2) Always call before hook shouldUseBrowserHook, should not affect before. 
3) After: getTestResult OR global hooks are not supported 
4) Check if isInteractive is still relevant and where does it fit 
5) before hook: call an endpoint to add the manager that was just created

*/

let manager, eyes;

function getGlobalConfigProperty(prop) {
  const property = Cypress.config(prop);
  const shouldParse = ['eyesBrowser', 'eyesLayoutBreakpoints'];
  return property ? (shouldParse.includes(prop) ? JSON.parse(property) : property) : undefined;
}

const shouldUseBrowserHooks =
  !getGlobalConfigProperty('eyesIsDisabled') &&
  (getGlobalConfigProperty('isInteractive') ||
    !getGlobalConfigProperty('eyesIsGlobalHooksSupported'));

before(async () => {
  // sendRequest({
  //   command: 'batchStart',
  //   data: {isInteractive: getGlobalConfigProperty('isInteractive')},
  // });
  cy.then({timeout: 86400000}, async () => {
    if (!connectedToUniversal) {
      await socket.connect(`ws://localhost:${Cypress.config('universalPort')}/eyes`);

      
      connectedToUniversal = true;
      await socket.emit('Core.makeSDK', {
        name: 'eyes.cypress',
        version: require('../../package.json').version,
        commands: Object.keys(spec),
        cwd: process.cwd(),
      });
     
      manager = await socket.request(
        'Core.makeManager',
        Object.assign(
          {},
          {concurrency: Cypress.config('eyesTestConcurrency')},
          {legacy: false, type: 'vg'},
        ),
      );
      await sendRequest({
        command: 'sendManager',
        data: manager,
      });
      socket.unref
    }
  });
});

if (shouldUseBrowserHooks) {
  after(async () => {
    cy.then({timeout: 86400000}, async () => {
      // return batchEnd().catch(e => {
      //   if (!!getGlobalConfigProperty('eyesFailCypressOnDiff')) {
      //     throw e;
      //   }
      // });

      // both commands should be in after global hooks
      await socket.request('EyesManager.closeAllEyes', {manager: manager, throwErr});
      // // need to look into options
      // await socket.request('Core.closeBatches', options)
    });
  });
}

let isCurrentTestDisabled;

Cypress.Commands.add('eyesOpen', function(args = {}) {
  spec.setRootContext();
  Cypress.config('eyesOpenArgs', args);
  Cypress.log({name: 'Eyes: open'});
  const userAgent = navigator.userAgent;
  const {title: testName} = this.currentTest || this.test || Cypress.currentTest;
  const {browser: eyesOpenBrowser, isDisabled} = args;
  const globalBrowser = getGlobalConfigProperty('eyesBrowser');
  const defaultBrowser = {
    width: getGlobalConfigProperty('viewportWidth'),
    height: getGlobalConfigProperty('viewportHeight'),
    name: 'chrome',
  };

  const browser =
    validateBrowser(eyesOpenBrowser) || validateBrowser(globalBrowser) || defaultBrowser;

  if (Cypress.config('eyesIsDisabled') && isDisabled === false) {
    throw new Error(
      `Eyes-Cypress is disabled by an env variable or in the applitools.config.js file, but the "${testName}" test was passed isDisabled:false. A single test cannot be enabled when Eyes.Cypress is disabled through the global configuration. Please remove "isDisabled:false" from cy.eyesOpen() for this test, or enable Eyes.Cypress in the global configuration, either by unsetting the APPLITOOLS_IS_DISABLED env var, or by deleting 'isDisabled' from the applitools.config.js file.`,
    );
  }
  isCurrentTestDisabled = getGlobalConfigProperty('eyesIsDisabled') || isDisabled;
  if (isCurrentTestDisabled) return;

  if (browser) {
    if (Array.isArray(browser)) {
      browser.forEach(fillDefaultBrowserName);
    } else {
      fillDefaultBrowserName(browser);
    }
  }

  return handleCypressViewport(browser).then({timeout: 15000}, async () =>
    // sendRequest({
    //   command: 'open',
    //   data: Object.assign({testName}, args, {browser, userAgent}),
    // }),
    cy.then({timeout: 86400000}, async () => {
      const driverRef = refer.ref(Cypress);
      eyes = await socket.request('EyesManager.openEyes', {
        manager: manager,
        driver: driverRef,
        config: Object.assign({testName}, args, {browser, userAgent}),
      });
    }),
  );
});

Cypress.Commands.add('eyesCheckWindow', args => {
  cy.then({timeout: 86400000}, async () => {
    Cypress.log({name: 'Eyes: check window'});
    if (isCurrentTestDisabled) return;
    const eyesOpenArgs = getGlobalConfigProperty('eyesOpenArgs');
    const defaultBrowser = {
      width: getGlobalConfigProperty('viewportWidth'),
      height: getGlobalConfigProperty('viewportHeight'),
    };
    const globalArgs = {
      browser: getGlobalConfigProperty('eyesBrowser'),
      layoutBreakpoints: getGlobalConfigProperty('eyesLayoutBreakpoints'),
      waitBeforeCapture: getGlobalConfigProperty('eyesWaitBeforeCapture'),
    };

    const browser = eyesOpenArgs.browser || globalArgs.browser || defaultBrowser;
    const layoutBreakpoints =
      (args && args.layoutBreakpoints) ||
      (eyesOpenArgs && eyesOpenArgs.layoutBreakpoints) ||
      globalArgs.layoutBreakpoints;

    const waitBeforeCapture =
      (args && args.waitBeforeCapture) ||
      (eyesOpenArgs && eyesOpenArgs.waitBeforeCapture) ||
      globalArgs.waitBeforeCapture;

    const checkArgs = {layoutBreakpoints, browser, waitBeforeCapture};
    if (typeof args === 'object') {
      Object.assign(checkArgs, args);
    } else {
      Object.assign(checkArgs, {tag: args});
    }

    const config = toCheckWindowConfiguration(checkArgs);

    //toCheckWindowConfiguration to convert user input , but the other way around.
    // need to consider fully, rn, it's true by default but, we probably need to change that.

     await socket.request('Eyes.check', {
      eyes,
      settings: checkArgs,
      config: config,
    });

  })
});

Cypress.Commands.add('eyesClose', async () => {
  Cypress.log({name: 'Eyes: close'});
  if (isCurrentTestDisabled) {
    isCurrentTestDisabled = false;
    return;
  }
  
  return await socket.request('Eyes.close', {eyes, throwErr});
});

function fillDefaultBrowserName(browser) {
  if (!browser.name && !browser.iosDeviceInfo && !browser.chromeEmulationInfo) {
    browser.name = 'chrome';
  }
}

function validateBrowser(browser) {
  if (!browser) return false;
  if (Array.isArray(browser)) return browser.length ? browser : false;
  if (Object.keys(browser).length === 0) return false;
  return browser;
}

function toCheckWindowConfiguration(config) {
  // check for other values to map
  const checkSettings = {
    name: config.tag,
    disableBrowserFetching: Cypress.config('eyesDisableBrowserFetching'),
    visualGridOptions: config.visualGridOptions,
    layoutBreakpoints: config.layoutBreakpoints,
    hooks: config.scriptHooks,
  };

  return checkSettings;
}

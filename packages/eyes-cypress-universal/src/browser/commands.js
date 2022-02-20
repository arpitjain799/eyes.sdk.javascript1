/* global Cypress,cy,after,navigator */
'use strict';
const spec = require('../../dist/browser/spec-driver');
const Refer = require('./refer');
const Socket = require('./socket');
const {socketCommands} = require('./socketCommands');

const refer = new Refer();
const socket = new Socket();
const throwErr = Cypress.config('failCypressOnDiff');
socketCommands(socket, refer);
let connectedToUniversal = false;

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

Cypress.Commands.add('eyesGetAllTestResults', () => {
  // make sure to leave batch open
  return socket.request('EyesManager.closeAllEyes', {manager, throwErr});
});

if (shouldUseBrowserHooks) {
  after(() => {
    if (!manager) return;
    return cy.then({timeout: 86400000}, async () => {
      const resultConfig = {
        showLogs: Cypress.config('appliConfFile').showLogs,
        eyesFailCypressOnDiff: Cypress.config('eyesFailCypressOnDiff'),
        isTextTerminal: Cypress.config('isTextTerminal'),
      };
      const testResults = await socket.request('EyesManager.closeAllEyes', {manager, throwErr});
      socket.request('Test.printTestResults', {testResults, resultConfig});
    });
  });
}

let isCurrentTestDisabled;

Cypress.Commands.add('eyesOpen', function(args = {}) {
  setRootContext();
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

  let browser =
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
      browser = [browser];
    }
  }

  return cy.then({timeout: 86400000}, async () => {
    const driverRef = refer.ref(cy.state('window').document);

    if (!connectedToUniversal) {
      socket.connect(`ws://localhost:${Cypress.config('eyesPort')}/eyes`);
      connectedToUniversal = true;
      socket.emit('Core.makeSDK', {
        name: 'eyes.cypress',
        version: require('../../package.json').version,
        commands: Object.keys(spec),
        cwd: process.cwd(),
      });

      manager =
        manager ||
        (await socket.request(
          'Core.makeManager',
          Object.assign(
            {},
            {concurrency: Cypress.config('eyesTestConcurrency')},
            {legacy: false, type: 'vg'},
          ),
        ));
    }
    // args.browsersInfo = args.browser
    // delete args.browser
    eyes = await socket.request('EyesManager.openEyes', {
      manager,
      driver: driverRef,
      config: Object.assign(
        {testName},
        args,
        {browsersInfo: browser, userAgent},
        Cypress.config('appliConfFile'),
        {dontCloseBatches: !shouldUseBrowserHooks},
      ), // batches will be closed by the plugin. Should we condition it on the existence of batch.id?
    });
  });
});

Cypress.Commands.add('eyesCheckWindow', args =>
  cy.then({timeout: 86400000}, () => {
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

    return socket.request('Eyes.check', {
      eyes,
      settings: config,
    });
  }),
);

Cypress.Commands.add('eyesClose', () => {
  return cy.then({timeout: 86400000}, () => {
    Cypress.log({name: 'Eyes: close'});
    if (isCurrentTestDisabled) {
      isCurrentTestDisabled = false;
      return;
    }

    // intentionally not returning the result in order to not wait on the close promise
    socket.request('Eyes.close', {eyes, throwErr: false}).catch(err => {
      console.log('Error in cy.eyesClose', err);
    });
  });
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
  let regionSettings = {};
  let shadowDomSettings = {};
  const checkSettings = {
    ignoreDisplacements: config.ignoreDisplacements,
    name: config.tag,
    disableBrowserFetching: Cypress.config('eyesDisableBrowserFetching'),
    visualGridOptions: config.visualGridOptions,
    layoutBreakpoints: config.layoutBreakpoints,
    hooks: config.scriptHooks,
    ignoreRegions: config.ignore,
    floatingRegions: config.floating,
    strictRegions: config.strict,
    layoutRegions: config.layout,
    contentRegions: config.content,
    accessibilityRegions: config.accessibility,
    waitBeforeCapture: config.waitBeforeCapture,
  };

  if (config.target === 'region') {
    if (!Array.isArray(config.selector)) {
      if (!config.hasOwnProperty('selector')) {
        regionSettings = {
          region: config.region,
        };
      } else {
        regionSettings = {
          region: config.selector,
        };
      }
    } else {
      const selectors = config.selector;
      for (let i = selectors.length - 1; i > -1; i--) {
        if (i === selectors.length - 1) {
          shadowDomSettings['shadow'] = selectors[i].selector;
        } else {
          const prevSettings = Object.assign({}, shadowDomSettings);
          shadowDomSettings['selector'] = selectors[i].selector;
          if (!prevSettings.hasOwnProperty('selector'))
            shadowDomSettings['shadow'] = prevSettings.shadow;
          else shadowDomSettings['shadow'] = prevSettings;
        }
      }
      regionSettings = {region: shadowDomSettings};
    }
  }

  return Object.assign({}, checkSettings, regionSettings);
}

function setRootContext() {
  cy.state('window').document['applitools-marker'] = 'root-context';
}

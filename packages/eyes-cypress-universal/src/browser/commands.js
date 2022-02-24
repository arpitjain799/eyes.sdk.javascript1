/* global Cypress,cy,after,navigator */
'use strict';
const spec = require('../../dist/browser/spec-driver');
const Refer = require('./refer');
const Socket = require('./socket');
const {socketCommands} = require('./socketCommands');
const {eyesOpenMapValues} = require('./eyesOpenMapping');
const {eyesCheckMapValues} = require('./eyesCheckMapping');

const refer = new Refer();
const socket = new Socket();
const throwErr = Cypress.config('failCypressOnDiff');
socketCommands(socket, refer);
let connectedToUniversal = false;

let manager,
  eyes,
  closePromiseArr = [];

function getGlobalConfigProperty(prop) {
  const property = Cypress.config(prop);
  const shouldParse = ['eyesBrowser', 'eyesLayoutBreakpoints'];
  return property ? (shouldParse.includes(prop) ? JSON.parse(property) : property) : undefined;
}

const shouldUseBrowserHooks =
  !getGlobalConfigProperty('eyesIsDisabled') &&
  (getGlobalConfigProperty('isInteractive') ||
    !getGlobalConfigProperty('eyesIsGlobalHooksSupported'));

Cypress.Commands.add('eyesGetAllTestResults', async () => {
  await Promise.all(closePromiseArr);
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
        tapDirPath: Cypress.config('appliConfFile').tapDirPath,
        tapFileName: Cypress.config('appliConfFile').tapFileName,
      };
      await Promise.all(closePromiseArr);
      const testResults = await socket.request('EyesManager.closeAllEyes', {manager, throwErr});
      socket.request('Test.printTestResults', {testResults, resultConfig});
    });
  });
}

let isCurrentTestDisabled;

Cypress.Commands.add('eyesOpen', function(args = {}) {
  setRootContext();
  Cypress.config('eyesOpenArgs', args);
  const {title: testName} = this.currentTest || this.test || Cypress.currentTest;

  if (Cypress.config('eyesIsDisabled') && args.isDisabled === false) {
    throw new Error(
      `Eyes-Cypress is disabled by an env variable or in the applitools.config.js file, but the "${testName}" test was passed isDisabled:false. A single test cannot be enabled when Eyes.Cypress is disabled through the global configuration. Please remove "isDisabled:false" from cy.eyesOpen() for this test, or enable Eyes.Cypress in the global configuration, either by unsetting the APPLITOOLS_IS_DISABLED env var, or by deleting 'isDisabled' from the applitools.config.js file.`,
    );
  }
  isCurrentTestDisabled = getGlobalConfigProperty('eyesIsDisabled') || args.isDisabled;
  if (isCurrentTestDisabled) return;

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

    const config = eyesOpenMapValues({args});
    eyes = await socket.request('EyesManager.openEyes', {
      manager,
      driver: driverRef,
      config: Object.assign({testName}, config, {
        dontCloseBatches:
          !shouldUseBrowserHooks || Cypress.config('appliConfFile').dontCloseBatches,
      }),
    });
  });
});

Cypress.Commands.add('eyesCheckWindow', args =>
  cy.then({timeout: 86400000}, () => {
    Cypress.log({name: 'Eyes: check window'});

    const config = eyesCheckMapValues({args});

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
    const p = socket.request('Eyes.close', {eyes, throwErr: false}).catch(err => {
      console.log('Error in cy.eyesClose', err);
    });
    closePromiseArr.push(p);
  });
});

function setRootContext() {
  cy.state('window').document['applitools-marker'] = 'root-context';
}

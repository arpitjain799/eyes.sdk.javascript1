'use strict';
const isGlobalHooksSupported = require('./isGlobalHooksSupported');
const {presult} = require('@applitools/functional-commons');
const childProcess = require('child_process');
const path = require('path');

function makePluginExport({startServer, eyesConfig, globalHooks}) {
  return function pluginExport(pluginModule) {
    let closeEyesServer;
    const pluginModuleExports = pluginModule.exports;
    pluginModule.exports = async function(...args) {
      const {localServerPort, closeServer} = await startServer();

      // fork a new process that start universal server
      const server = childProcess.spawn('node', [path.resolve(__dirname,'../../node_modules/@applitools/eyes-universal/dist/cli.js')], {
        detached: true,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      const waitForServerResponse = new Promise(resolve => {
        server.stdout.once('data', data => {
        ;(server.stdout).unref()
        const [port] = String(data).split('\n', 1)
        resolve(port)
      })
    })
    const universalPort = await waitForServerResponse;
  
    server.unref()
        
    closeEyesServer = closeEyesServer = function() {
      this.send('close server');
    }

      const [origOn, config] = args;
      const isGlobalHookCalledFromUserHandlerMap = new Map();
      eyesConfig.eyesIsGlobalHooksSupported = isGlobalHooksSupported(config);
      const moduleExportsResult = await pluginModuleExports(onThatCallsUserDefinedHandler, config);
      if (eyesConfig.eyesIsGlobalHooksSupported) {
        for (const [eventName, eventHandler] of Object.entries(globalHooks)) {
          if (!isGlobalHookCalledFromUserHandlerMap.get(eventName)) {
            origOn.call(this, eventName, eventHandler);
          }
        }
      }


      return Object.assign({}, eyesConfig, {universalPort, localServerPort}, moduleExportsResult);

      // This piece of code exists because at the point of writing, Cypress does not support multiple event handlers:
      // https://github.com/cypress-io/cypress/issues/5240#issuecomment-948277554
      // So we wrap Cypress' `on` function in order to wrap the user-defined handler. This way we can call our own handler
      // in addition to the user's handler
      function onThatCallsUserDefinedHandler(eventName, handler) {
        const isRunEvent = eventName === 'before:run' || eventName === 'after:run';
        let handlerToCall = handler;
        if (eyesConfig.eyesIsGlobalHooksSupported && isRunEvent) {
          handlerToCall = handlerThatCallsUserDefinedHandler;
          isGlobalHookCalledFromUserHandlerMap.set(eventName, true);
        }
        return origOn.call(this, eventName, handlerToCall);

        async function handlerThatCallsUserDefinedHandler() {
          const [err] = await presult(
            Promise.resolve(globalHooks[eventName].apply(this, arguments)),
          );
          await handler.apply(this, arguments);
          if (err) {
            throw err;
          }
        }
      }
    };
    return function getCloseServer() {
      return closeEyesServer.bind(server);
    };
  };
}

module.exports = makePluginExport;

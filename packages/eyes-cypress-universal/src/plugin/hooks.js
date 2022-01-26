'use strict';
const axios = require('axios');
const makeSocket = require('./webSocket')


function makeGlobalRunHooks() {
  let waitForBatch;

  return {
    'before:run': ({config}) => {
      if (!config.isTextTerminal) return;
    },

    'after:run': async ({config}) => {
      if (!config.isTextTerminal) return;
      const socket = makeSocket()
      try {
        const throwErr = false
        const results = []
        //Cypress.config('failCypressOnDiff');
        // const socket = new Socket();
        // socket.connect(`http://localhost:${config.universalPort}/eyes`);

        // const webSocket = new WebSocket(`ws://localhost:${config.universalPort}/eyes`)
        socket.connect(`http://localhost:${config.universalPort}/eyes`)

        const resp = await axios.get(`https://localhost:${config.localServerPort}/eyes/getAllManagers`);
        const managers = resp && resp.data && resp.data.managers ? resp.data.managers : [];
        for (const manager of managers) {
          const currRes = await socket.request('EyesManager.closeAllEyes', {manager, throwErr});
          results.push(currRes)
        }
        // fillout options
        socket.request('Core.closeBatches', options);
      } catch (e) {
        if (!!config.eyesFailCypressOnDiff) {
          throw e;
        }
      }
    },
  };
}

module.exports = makeGlobalRunHooks;

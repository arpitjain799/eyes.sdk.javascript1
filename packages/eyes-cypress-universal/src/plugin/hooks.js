'use strict';
const axios = require('axios');
const Socket = require('../browser/socket');

function makeGlobalRunHooks() {
  let waitForBatch;

  return {
    'before:run': ({config}) => {
      if (!config.isTextTerminal) return;
    },

    'after:run': async ({config}) => {
      if (!config.isTextTerminal) return;

      try {
        const throwErr = Cypress.config('failCypressOnDiff');
        const socket = new Socket();
        socket.connect(`http://localhost:${Cypress.config('universalPort')}/eyes`);

        const resp = axios.get(`https/localhost:${config.localServerPort}/eyes/getAllManagers`);
        const managers = resp && resp.managers ? resp.managers : [];
        for (const manager of managers) {
          socket.request('EyesManager.closeAllEyes', {manager, throwErr});
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

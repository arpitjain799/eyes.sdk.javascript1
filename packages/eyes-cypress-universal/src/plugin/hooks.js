'use strict';

function makeGlobalRunHooks({closeAllEyes}) {
  return {
    'before:run': ({config}) => {
      if (!config.isTextTerminal) return;
    },

    'after:run': async ({config}) => {
      if (!config.isTextTerminal) return;
      try {
        await closeAllEyes();
      } catch (e) {
        if (!!config.eyesFailCypressOnDiff) {
          throw e;
        }
      }
    },
  };
}

module.exports = makeGlobalRunHooks;

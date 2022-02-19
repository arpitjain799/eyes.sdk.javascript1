'use strict';

function makeGlobalRunHooks({closeAllEyes}) {
  return {
    'before:run': ({config}) => {
      if (!config.isTextTerminal) return;
    },

    'after:run': ({config}) => {
      if (!config.isTextTerminal) return;
      const resultConfig = {showLogs: config.showLogs, eyesFailCypressOnDiff: config.eyesFailCypressOnDiff, isTextTerminal: config.isTextTerminal}
      closeAllEyes(resultConfig);
    },
  };
}

module.exports = makeGlobalRunHooks;

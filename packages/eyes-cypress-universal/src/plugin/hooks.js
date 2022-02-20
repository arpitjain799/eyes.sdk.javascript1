'use strict';

function makeGlobalRunHooks({closeAllEyes, printTestResults, closeBatches}) {
  return {
    'before:run': ({config}) => {
      if (!config.isTextTerminal) return;
    },

    'after:run': async ({config}) => {
      if (!config.isTextTerminal) return;
      const resultConfig = {showLogs: config.showLogs, eyesFailCypressOnDiff: config.eyesFailCypressOnDiff, isTextTerminal: config.isTextTerminal}
      const testResults = await closeAllEyes(resultConfig);
      await closeBatches([config.appliConfFile.batch.id])
      printTestResults({testResults, resultConfig})
    },
  };
}

module.exports = makeGlobalRunHooks;

'use strict';
const flatten = require('lodash.flatten');
const {TestResults} = require('@applitools/visual-grid-client');

function makeGlobalRunHooks({closeAllEyes, utils}) {
  return {
    'before:run': ({config}) => {
      if (!config.isTextTerminal) return;
    },

    'after:run': async ({config}) => {
      if (!config.isTextTerminal) return;
      const resultConfig = {
        showLogs: config.showLogs,
        eyesFailCypressOnDiff: config.eyesFailCypressOnDiff,
        isTextTerminal: config.isTextTerminal,
      };
      const testResults = await closeAllEyes();
      const testResultsArr = [];
      for (const result of flatten(testResults)) {
        testResultsArr.push(new TestResults(result));
      }
      if (!config.appliConfFile.dontCloseBatches)
        await utils.closeBatches([config.appliConfFile.batch.id]);

      if (config.appliConfFile.tapDirPath) {
        await utils.handleBatchResultsFile(testResultsArr, {
          tapDirPath: config.appliConfFile.tapDirPath,
          tapFileName: config.appliConfFile.tapFileName,
        });
      }
      utils.printTestResults({testResults: testResultsArr, resultConfig});
    },
  };
}

module.exports = makeGlobalRunHooks;

'use strict';
const flatten = require('lodash.flatten');

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
      if (!config.appliConfFile.dontCloseBatches)
        await utils.closeBatches([config.appliConfFile.batch.id]);
      // if (config.appliConfFile.tapDirPath)
      //   await utils.handleBatchResultsFile((flatten(testResults)), {
      //     tapDirPath: config.appliConfFile.tapDirPath,
      //     tapFileName: config.appliConfFile.tapFileName,
      //   });
      utils.printTestResults({testResults: flatten(testResults), resultConfig});
    },
  };
}


module.exports = makeGlobalRunHooks;

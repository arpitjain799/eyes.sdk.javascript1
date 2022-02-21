'use strict';
const {makeHandler} = require('../../dist/plugin/handler');
const connectSocket = require('./webSocket');
const {makeServerProcess} = require('@applitools/eyes-universal');
const errorDigest = require('./errorDigest');
const {makeLogger} = require('@applitools/logger');
const getErrorsAndDiffs = require('./getErrorsAndDiffs');
const {promisify} = require('util');
const fs = require('fs');
const writeFile = promisify(fs.writeFile);
const {TestResultsFormatter} = require('@applitools/visual-grid-client');
const {resolve} = require('path');

function makeStartServer() {
  return async function startServer() {
    const {server, port} = await makeHandler({});
    const {port: universalPort} = await makeServerProcess();

    const managers = [];
    let socketWithUniversal

    server.on('connection', socketWithClient => {
      socketWithUniversal = connectSocket(`ws://localhost:${universalPort}/eyes`);

      socketWithUniversal.setPassthroughListener(message => {
        console.log('<== ', message.toString().slice(0, 400));
        const {name, payload} = JSON.parse(message);
        if (name === 'Core.makeManager') {
          managers.push({manager: payload.result, socketWithUniversal});
        }

        socketWithClient.send(message.toString());
      });

      socketWithClient.on('message', message => {
        const msg = JSON.parse(message)
        console.log('==> ', message.toString().slice(0, 400));
        socketWithUniversal.send(message);
        if(msg.name === 'Test.printTestResults') {
          printTestResults(msg.payload)
        }
      });
    
    });

    return {server, port, closeAllEyes, utils: {printTestResults, closeBatches, handleBatchResultsFile}};

    function closeAllEyes() {
        return Promise.all(
          managers.map(({manager, socketWithUniversal}) =>
            socketWithUniversal.request('EyesManager.closeAllEyes', {
              manager,
              throwErr: false,
            }),
          ),
        );
      }

    function closeBatches(batchIds){
      if(socketWithUniversal)
        return socketWithUniversal.request('Core.closeBatches', {settings: {batchIds}})
    }

    function printTestResults(testResultsArr){
      const logger = makeLogger({level: testResultsArr.resultConfig.showLogs ? 'info' : 'silent', label: 'eyes'});
      const {passed, failed, diffs} = getErrorsAndDiffs(testResultsArr.testResults);
      if ((failed.length || diffs.length) && !!testResultsArr.resultConfig.eyesFailCypressOnDiff) {
        throw new Error(errorDigest({
          passed,
          failed,
          diffs,
          logger,
          isInteractive: !testResultsArr.resultConfig.isTextTerminal,
        }));
      }
    }
    function handleBatchResultsFile(results, tapFileConfig) {
      try {
      const formatter = new TestResultsFormatter(results);
      const fileName = tapFileConfig.tapFileName || `${new Date().toISOString()}-eyes.tap`;
      const tapFile = resolve(tapFileConfig.tapDirPath, fileName);
      return writeFile(tapFile, formatter.asHierarchicTAPString(false, true));
      } catch(ex){
        console.log(ex)
      }
    };
  };
}

module.exports = makeStartServer;

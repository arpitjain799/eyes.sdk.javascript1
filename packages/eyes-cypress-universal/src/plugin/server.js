'use strict';
const {makeHandler} = require('../../dist/plugin/handler');
const connectSocket = require('./webSocket');
const {makeServerProcess} = require('@applitools/eyes-universal');
const errorDigest = require('./errorDigest');
const {makeLogger} = require('@applitools/logger');
const getErrorsAndDiffs = require('./getErrorsAndDiffs');
const flatten = require('lodash.flatten');

function makeStartServer() {
  return async function startServer() {
    const {server, port} = await makeHandler({});
    const {port: universalPort} = await makeServerProcess();

    const managers = [];

    server.on('connection', socketWithClient => {
      const socketWithUniversal = connectSocket(`ws://localhost:${universalPort}/eyes`);

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

    return {server, port, closeAllEyes};

    async function closeAllEyes(resultConfig) {
      const testResults = await Promise.all(
        managers.map(({manager, socketWithUniversal}) =>
          socketWithUniversal.request('EyesManager.closeAllEyes', {
            manager,
            throwErr: false,
          }),
        ),
      );
      printTestResults({testResults, resultConfig})
    }

  function printTestResults(testResultsArr){
    const logger = makeLogger({level: testResultsArr.resultConfig.showLogs ? 'info' : 'silent', label: 'eyes'});
    const {passed, failed, diffs} = getErrorsAndDiffs(flatten(testResultsArr.testResults));
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
  };
}

module.exports = makeStartServer;

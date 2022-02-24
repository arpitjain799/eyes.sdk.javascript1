'use strict';
const {makeHandler} = require('../../dist/plugin/handler');
const connectSocket = require('./webSocket');
const {makeServerProcess} = require('@applitools/eyes-universal');
const {TestResults} = require('@applitools/visual-grid-client');
const handleTestResults = require('./handleTestResults');

function makeStartServer() {
  return async function startServer() {
    const {server, port} = await makeHandler({});
    const {port: universalPort} = await makeServerProcess();

    const managers = [];
    let socketWithUniversal;

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
        const msg = JSON.parse(message);
        console.log('==> ', message.toString().slice(0, 400));
        if (msg.name === 'Test.printTestResults') {
          const resultArr = [];
          for (const result of msg.payload.testResults) {
            resultArr.push(new TestResults(result));
          }
          handleTestResults.printTestResults({
            testResults: resultArr,
            resultConfig: msg.payload.resultConfig,
          });
          if (msg.payload.resultConfig.tapDirPath) {
            handleTestResults.handleBatchResultsFile(resultArr, {
              tapFileName: msg.payload.resultConfig.tapFileName,
              tapDirPath: msg.payload.resultConfig.tapDirPath,
            });
          }
        } else {
          socketWithUniversal.send(message);
        }
      });
    });

    return {
      server,
      port,
      closeAllEyes,
      closeBatches,
    };

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
    function closeBatches(batchIds) {
      if (socketWithUniversal)
        return socketWithUniversal.request('Core.closeBatches', {settings: {batchIds}});
    }
  };
}

module.exports = makeStartServer;

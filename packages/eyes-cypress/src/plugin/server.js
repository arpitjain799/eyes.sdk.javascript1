'use strict';
const {makeHandler} = require('../../dist/plugin/handler');
const connectSocket = require('./webSocket');
const {makeServerProcess} = require('@applitools/eyes-universal');
const {TestResults} = require('@applitools/visual-grid-client');
const handleTestResults = require('./handleTestResults');

function makeStartServer({logger}) {
  return async function startServer() {
    const {server, port} = await makeHandler({singleton: false});

    const {port: universalPort, close: closeUniversalServer} = await makeServerProcess();

    const managers = [];
    let batchIds = [];
    let socketWithUniversal;

    server.on('connection', socketWithClient => {
      socketWithUniversal = connectSocket(`ws://localhost:${universalPort}/eyes`);

      socketWithUniversal.setPassthroughListener(message => {
        logger.log('<== ', message.toString().slice(0, 1000));
        const {name, payload} = JSON.parse(message);
        if (name === 'Core.makeManager') {
          managers.push({manager: payload.result, socketWithUniversal});
        }

        socketWithClient.send(message.toString());
      });

      socketWithClient.on('message', message => {
        const msg = JSON.parse(message);
        logger.log('==> ', message.toString().slice(0, 1000));
        if (msg.name === 'Test.printTestResults') {
          try {
            const resultArr = [];
            for (const result of msg.payload.testResults) {
              resultArr.push(new TestResults(result));
            }
            if (msg.payload.resultConfig.tapDirPath) {
              handleTestResults.handleBatchResultsFile(resultArr, {
                tapFileName: msg.payload.resultConfig.tapFileName,
                tapDirPath: msg.payload.resultConfig.tapDirPath,
              });
            }
            handleTestResults.printTestResults({
              testResults: resultArr,
              resultConfig: msg.payload.resultConfig,
            });
            socketWithClient.send(
              JSON.stringify({
                name: 'Test.printTestResults',
                key: msg.key,
                payload: {result: 'success'},
              }),
            );
          } catch (ex) {
            socketWithClient.send(
              JSON.stringify({
                name: 'Test.printTestResults',
                key: msg.key,
                payload: {result: ex.message.toString()},
              }),
            );
          }
        } else if (msg.name == 'Test.saveBatchId') {
          if (!batchIds.includes(msg.payload.batchIdEyesOpen)) {
            batchIds.push(msg.payload.batchIdEyesOpen);
          }
          socketWithClient.send(
            JSON.stringify({
              name: 'Test.saveBatchId',
              key: msg.key,
              payload: {result: 'success'},
            }),
          );
        } else {
          socketWithUniversal.send(message);
        }
      });
    });

    return {
      server,
      port,
      closeManager,
      closeBatches,
      closeUniversalServer,
      getAllBatchIds,
    };

    function getAllBatchIds() {
      const tmp = batchIds;
      batchIds = [];
      return tmp;
    }
    function closeManager() {
      return Promise.all(
        managers.map(({manager, socketWithUniversal}) =>
          socketWithUniversal.request('EyesManager.closeManager', {
            manager,
            throwErr: false,
          }),
        ),
      );
    }
    function closeBatches(settings) {
      logger.log('==> ', `{name: 'Core.closeBatches', "payload":${JSON.stringify(settings)}}`);
      if (socketWithUniversal) {
        return socketWithUniversal.request('Core.closeBatches', {settings}).catch(err => {
          // if the user defined a batchId in eyesOpen, then we also send the random Id we created that does not have any use,
          //this will throw Batch not found error that we don't want to propagate to the user
          if (!err.message.includes('Batch not found')) {
            logger.log(`@@@ in closeBatches, batchIds: ${settings.batchId}`, err);
          }
        });
      }
    }
  };
}

module.exports = makeStartServer;

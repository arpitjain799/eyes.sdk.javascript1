'use strict';
import connectSocket from './webSocket';
// @ts-ignore
import {makeServerProcess} from '@applitools/eyes-universal';
import handleTestResults from './handleTestResults';
import path from 'path';
import fs from 'fs';
// @ts-ignore
import semverLt from 'semver/functions/lt';
import {Server as HttpsServer} from 'https';
import {Server as WSServer} from 'ws';
import which from 'which';

export default function makeStartServer({logger}: any) {
  return async function startServer() {
    const key = fs.readFileSync(path.resolve(__dirname, '../../src/pem/server.key'));
    const cert = fs.readFileSync(path.resolve(__dirname, '../../src/pem/server.cert'));
    let port;

    const https = new HttpsServer({
      key,
      cert,
    });
    // @ts-ignore
    await https.listen(0, (err: any) => {
      if (err) {
        logger.log('error starting plugin server', err);
      } else {
        port = (https.address() as any).port;
        logger.log(`plugin server running at port: ${port}`);
      }
    });

    const wss = new WSServer({server: https, path: '/eyes', maxPayload: 254 * 1024 * 1024});

    wss.on('close', () => https.close());

    const forkOptions = {
      detached: true,
    };

    const cypressVersion = require('cypress/package.json').version;

    // `cypress` version below `7.0.0` has an old Electron version which not support async shell process.
    // By passing `execPath` with the node process cwd it will switch the `node` process to be the like the OS have
    // and will not use the unsupported `Cypress Helper.app` with the not supported shell process Electron
    if (semverLt(cypressVersion, '7.0.0')) {
      // @ts-ignore
      forkOptions.execPath = await which('node');
    }

    const {port: universalPort, close: closeUniversalServer} = await makeServerProcess({
      idleTimeout: 0,
      shutdownMode: 'stdin',
      forkOptions,
      singleton: false,
      portResolutionMode: 'random',
    });

    const managers: any[] = [];
    let socketWithUniversal: any;

    wss.on('connection', socketWithClient => {
      socketWithUniversal = connectSocket(`ws://localhost:${universalPort}/eyes`);

      socketWithUniversal.setPassthroughListener((message: any) => {
        logger.log('<== ', message.toString().slice(0, 1000));
        const {name, payload} = JSON.parse(message);
        if (name === 'Core.makeManager') {
          managers.push({manager: payload.result, socketWithUniversal});
        }

        socketWithClient.send(message.toString());
      });

      socketWithClient.on('message', (message: string) => {
        const msg = JSON.parse(message);
        logger.log('==> ', message.toString().slice(0, 1000));
        if (msg.name === 'Core.makeSDK') {
          const newMessage = Buffer.from(
            JSON.stringify({
              name: msg.name,
              key: msg.key,
              payload: Object.assign(msg.payload, {cwd: process.cwd()}),
            }),
            'utf-8',
          );
          socketWithUniversal.send(newMessage);
        } else if (msg.name === 'Test.printTestResults') {
          try {
            if (
              msg.payload.resultConfig.tapDirPath &&
              msg.payload.resultConfig.shouldCreateTapFile
            ) {
              handleTestResults.handleBatchResultsFile(msg.payload.testResults, {
                tapFileName: msg.payload.resultConfig.tapFileName,
                tapDirPath: msg.payload.resultConfig.tapDirPath,
              });
            }
            handleTestResults.printTestResults({
              testResults: msg.payload.testResults,
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
        } else {
          socketWithUniversal.send(message);
        }
      });
    });

    return {
      server: wss,
      port,
      closeManager,
      closeBatches,
      closeUniversalServer,
    };

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
    function closeBatches(settings: any) {
      if (socketWithUniversal)
        return socketWithUniversal.request('Core.closeBatches', {settings}).catch((err: any) => {
          logger.log('@@@', err);
        });
    }
  };
}

'use strict';
const {makeHandler} = require('../../dist/plugin/handler');
const connectSocket = require('./webSocket');
const {makeServerProcess} = require('@applitools/eyes-universal');

function makeStartServer() {
  return async function startServer() {
    const {server, port} = await makeHandler({});
    const {port: universalPort} = await makeServerProcess();

    server.on('connection', socketWithClient => {
      const socketWithUniversal = connectSocket(`ws://localhost:${universalPort}/eyes`);

      socketWithUniversal.onMessage(message => {
        console.log('<== ', message.toString());
        socketWithClient.send(message.toString());
      });

      socketWithClient.on('message', message => {
        console.log('==> ', message.toString());
        socketWithUniversal.send(message);
      });
    });
    return {server, port};
  };
}

module.exports = makeStartServer;

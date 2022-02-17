'use strict';
const {makeHandler} = require('../../dist/plugin/handler');
const connectSocket = require('./webSocket');
const {makeServerProcess} = require('@applitools/eyes-universal');

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
        console.log('==> ', message.toString().slice(0, 400));
        socketWithUniversal.send(message);
      });
    });

    return {server, port, closeAllEyes};

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
  };
}

module.exports = makeStartServer;

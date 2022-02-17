const WebSocket = require('ws');

function connectSocket(url) {
  const socket = new WebSocket(url);
  const listeners = new Set();
  const queue = new Set();
  let isReady = false;

  attach();

  function attach() {
    if (socket.readyState === WebSocket.CONNECTING) socket.on('open', () => attach(socket));
    else if (socket.readyState === WebSocket.OPEN) {
      isReady = true;
      queue.forEach(command => command());
      queue.clear();

      socket.on('message', message => {
        listeners.forEach(fn => fn(message));
      });
    }
  }

  function disconnect() {
    if (!socket) return;
    socket.terminate();
    isReady = false;
    listeners.clear();
    queue.clear();
  }

  function onMessage(fn) {
    listeners.add(fn);
    return () => offMessage(fn);
  }

  function offMessage(fn) {
    const existed = listeners.delete(fn);
    return existed;
  }

  function send(message) {
    const command = () => socket.send(message);
    if (isReady) command();
    else queue.add(command);
    return () => queue.delete(command);
  }

  function ref() {
    const command = () => socket._socket.ref();
    if (isReady) command();
    else queue.add(command);
    return () => queue.delete(command);
  }

  function unref() {
    const command = () => socket._socket.unref();
    if (isReady) command();
    else queue.add(command);
    return () => queue.delete(command);
  }

  return {
    onMessage,
    offMessage,
    send,
    disconnect,
    ref,
    unref,
  };
}

module.exports = connectSocket;
